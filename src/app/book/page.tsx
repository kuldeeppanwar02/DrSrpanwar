"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Share2,
  Eye,
  PlusCircle,
  AlertTriangle,
  Pill,
  Loader2,
} from "lucide-react";
import { buildClinicHref } from "@/features/clinic/catalog";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";

const dayOptions = ["Aaj", "Kal"] as const;

/**
 * Generate time slots between open and close times.
 * E.g. generateSlots("09:00", "13:00", 30) => ["09:00 AM","09:30 AM","10:00 AM",...]
 */
function generateSlots(openTime: string, closeTime: string, intervalMin = 30): string[] {
  if (!openTime || !closeTime) return [];
  const slots: string[] = [];
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  let current = oh * 60 + (om || 0);
  const end = ch * 60 + (cm || 0);

  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    slots.push(`${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`);
    current += intervalMin;
  }
  return slots;
}

/** Default fallback slots if schedule hasn't been configured yet */
const defaultSlots: Record<string, string[]> = {
  surgery: generateSlots("09:00", "17:00"),
  dental: generateSlots("10:00", "17:00"),
};

/**
 * Filter out past time slots for today.
 * Returns only slots that are in the future (with a small buffer).
 */
function filterPastSlots(slots: string[]): string[] {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return slots.filter((slot) => {
    // Parse "09:30 AM" or "01:00 PM" format
    const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return true; // keep slot if can't parse
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const slotMinutes = h * 60 + m;
    // Only show slots at least 15 minutes in the future
    return slotMinutes > currentMinutes + 15;
  });
}

function buildWhatsAppUrl(clinic: string, token: string, day: string, slot: string): string {
  const msg = encodeURIComponent(
    `🏥 मेरा अपॉइंटमेंट बुक हो गया!\n\n` +
    `📋 टोकन: ${token}\n` +
    `🏥 क्लिनिक: ${clinic}\n` +
    `📅 ${day} · ${slot}\n\n` +
    `Panwar SmartCare Hub`
  );
  return `https://wa.me/?text=${msg}`;
}

type BookingConfirmation = {
  bookingId: string;
  token: string;
  dayLabel: string;
  slotLabel: string;
  syncState: "synced" | "pending";
};

type DayScheduleData = {
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slots: string[];
  maxPatients: number;
};

export default function BookPage() {
  const { activeClinic, activeClinicId, createBooking, isOnline, syncInFlight } = useClinic();
  const { t } = useLang();

  // Block pharmacy from booking
  if (!activeClinic.hasBooking) {
    return (
      <div className="page-shell">
        <div className="section-shell flex min-h-[50vh] items-center justify-center py-10">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
              <Pill className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <h1 className="display-type mt-4 text-xl text-[var(--accent-strong)]">
              {t("pharmacy", "infoTitle")}
            </h1>
            <p className="mt-3 text-sm text-[rgba(19,49,58,0.6)]">
              {t("pharmacy", "noBookingNeeded")}
            </p>
            <div className="card mt-4 p-4 text-left space-y-2">
              <p className="flex items-center gap-2 text-sm text-[rgba(19,49,58,0.65)]">
                <Clock className="h-3.5 w-3.5 text-[var(--accent)]" /> {activeClinic.locationLabel}
              </p>
              <p className="flex items-center gap-2 text-sm text-[rgba(19,49,58,0.65)]">
                <Clock className="h-3.5 w-3.5 text-[var(--accent)]" /> {activeClinic.hoursLabel}
              </p>
              <p className="flex items-center gap-2 text-sm text-[rgba(19,49,58,0.65)]">
                <Phone className="h-3.5 w-3.5 text-[var(--accent)]" /> {activeClinic.phone}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href={buildClinicHref("/walkin", activeClinicId)} className="btn btn-warm btn-lg">
                {t("pharmacy", "pickupToken")}
              </Link>
              <Link href={buildClinicHref("/", activeClinicId)} className="btn btn-outline btn-lg">
                {t("common", "back")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [dayLabel, setDayLabel] = useState<"Aaj" | "Kal">("Aaj");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [requiresPharmacyFollowUp, setRequiresPharmacyFollowUp] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleSlots, setScheduleSlots] = useState<Record<string, string[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(true);

  // Fetch schedule and generate slots dynamically
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoadingSlots(true);
      try {
        // Fetch this week (Aaj) and next week offset if needed (Kal might be next week)
        const res = await fetch(`/api/schedule?clinic=${activeClinicId}&weekOffset=0`);
        if (res.ok) {
          const data = await res.json();
          const schedule: DayScheduleData[] = data.schedule || [];

          // Get today and tomorrow's day names
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const todayName = dayNames[today.getDay()];
          const tomorrowName = dayNames[tomorrow.getDay()];

          const todaySchedule = schedule.find((d) => d.dayName === todayName);
          const tomorrowSchedule = schedule.find((d) => d.dayName === tomorrowName);

          const newSlots: Record<string, string[]> = {};

          if (todaySchedule?.isOpen && todaySchedule.slots?.length > 0) {
            newSlots["Aaj"] = todaySchedule.slots;
          } else if (todaySchedule?.isOpen && todaySchedule.openTime && todaySchedule.closeTime) {
            newSlots["Aaj"] = generateSlots(todaySchedule.openTime, todaySchedule.closeTime);
          } else {
            newSlots["Aaj"] = defaultSlots[activeClinicId] || [];
          }

          if (tomorrowSchedule?.isOpen && tomorrowSchedule.slots?.length > 0) {
            newSlots["Kal"] = tomorrowSchedule.slots;
          } else if (tomorrowSchedule?.isOpen && tomorrowSchedule.openTime && tomorrowSchedule.closeTime) {
            newSlots["Kal"] = generateSlots(tomorrowSchedule.openTime, tomorrowSchedule.closeTime);
          } else {
            newSlots["Kal"] = defaultSlots[activeClinicId] || [];
          }

          setScheduleSlots(newSlots);
        } else {
          // Fallback to defaults
          setScheduleSlots({
            Aaj: defaultSlots[activeClinicId] || [],
            Kal: defaultSlots[activeClinicId] || [],
          });
        }
      } catch {
        setScheduleSlots({
          Aaj: defaultSlots[activeClinicId] || [],
          Kal: defaultSlots[activeClinicId] || [],
        });
      } finally {
        setLoadingSlots(false);
      }
    };
    void fetchSchedule();
  }, [activeClinicId]);

  const currentSlots = useMemo(
    () => {
      const raw = scheduleSlots[dayLabel] || defaultSlots[activeClinicId] || [];
      // For "Aaj" (Today), filter out time slots that have already passed
      return dayLabel === "Aaj" ? filterPastSlots(raw) : raw;
    },
    [scheduleSlots, dayLabel, activeClinicId],
  );
  const [slotLabel, setSlotLabel] = useState("");

  // Auto-select first slot when slots change
  useEffect(() => {
    if (currentSlots.length > 0 && !currentSlots.includes(slotLabel)) {
      setSlotLabel(currentSlots[0]);
    }
  }, [currentSlots, slotLabel]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t("booking", "nameRequired"));
      return;
    }
    // Mobile is OPTIONAL — only validate if provided
    if (mobile.trim() && mobile.replace(/\D/g, "").length !== 10) {
      setError(t("booking", "invalidMobile"));
      return;
    }
    setIsSubmitting(true);
    try {
      const nextState = await createBooking({
        clinicId: activeClinicId,
        dayLabel,
        slotLabel,
        name,
        mobile: mobile.trim() || "",
        requiresPharmacyFollowUp,
      });
      const latestEntry = nextState.queue[nextState.queue.length - 1];
      setConfirmation({
        bookingId: latestEntry.bookingId,
        token: latestEntry.token,
        dayLabel: latestEntry.dayLabel,
        slotLabel: latestEntry.slotLabel,
        syncState: latestEntry.syncState,
      });
      setName("");
      setMobile("");
      setError("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Booking failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="page-shell">
        <div className="section-shell py-10">
          <div className="mx-auto max-w-lg">
            <div className="fade-up card card-elevated p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--success-soft)]">
                <CheckCircle2 className="h-6 w-6 text-[var(--success)]" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--success)]">
                {t("booking", "confirmed")}
              </p>
              <div className="mt-5 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] p-5 text-white">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[rgba(255,255,255,0.6)]">
                  {t("booking", "token")}
                </p>
                <p className="display-type mt-2 text-5xl">{confirmation.token}</p>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-[rgba(19,49,58,0.65)]">
                <p>{t("booking", "bookingId")}: <strong>{confirmation.bookingId}</strong></p>
                <p className="flex items-center justify-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5 text-[var(--accent)]" />
                  {confirmation.dayLabel} · {confirmation.slotLabel}
                </p>
                <p>{t("common", "clinic")}: <strong>{activeClinic.shortName}</strong></p>
                <span className={`badge ${confirmation.syncState === "pending" ? "badge-waiting" : "badge-done"}`}>
                  {confirmation.syncState === "pending" ? t("booking", "pending") : t("booking", "synced")}
                </span>
              </div>
              {syncInFlight && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
                  <Loader2 className="h-3 w-3 animate-spin-slow" /> {t("home", "syncing")}...
                </p>
              )}
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--warm-soft)] px-3 py-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[var(--warm)]" />
                <p className="text-xs font-medium text-[#8b4626] text-left">{t("booking", "screenshotNote")}</p>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <a
                  href={buildWhatsAppUrl(
                    activeClinic.shortName,
                    confirmation.token,
                    confirmation.dayLabel === "Aaj" ? t("booking", "today") : t("booking", "tomorrow"),
                    confirmation.slotLabel,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm" style={{background:'#25D366',color:'white'}}
                >
                  <Share2 className="h-3 w-3" /> {t("whatsapp", "shareBtn")}
                </a>
                <Link href={buildClinicHref("/status", activeClinicId)} className="btn btn-outline btn-sm">
                  <Eye className="h-3 w-3" /> {t("booking", "viewToken")}
                </Link>
                <button type="button" onClick={() => setConfirmation(null)} className="btn btn-primary btn-sm">
                  <PlusCircle className="h-3 w-3" /> {t("booking", "bookAnother")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="section-shell py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="display-type text-center text-2xl text-[var(--accent-strong)] sm:text-3xl">
            {t("booking", "title")} — {activeClinic.shortName}
          </h1>

            <div className="mt-8 space-y-5">
            {/* Step 1: Day */}
            <div className="card p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                <CalendarCheck className="h-3.5 w-3.5" />
                {t("booking", "step")} 1 · {t("booking", "chooseDay")}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {dayOptions.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={`rounded-xl px-4 py-3 text-left transition ${
                      dayLabel === day
                        ? "bg-[var(--accent)] text-white"
                        : "border border-[var(--line)] hover:border-[var(--accent)]"
                    }`}
                    onClick={() => {
                      setDayLabel(day);
                    }}
                  >
                    <p className="text-lg font-semibold">
                      {day === "Aaj" ? t("booking", "today") : t("booking", "tomorrow")}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Slot */}
            <div className="card p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                <Clock className="h-3.5 w-3.5" />
                {t("booking", "step")} 2 · {t("booking", "chooseSlot")}
              </p>
              {loadingSlots ? (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-[rgba(19,49,58,0.5)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin-slow" /> {t("common", "loading")}
                </p>
              ) : currentSlots.length === 0 ? (
                <div className="mt-3 flex flex-col gap-2 rounded-xl bg-[var(--warm-soft)] px-3 py-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[var(--warm)]" />
                    <p className="text-sm font-medium text-[#8b4626]">
                      {dayLabel === "Aaj"
                        ? (t("booking", "todayClosed") || "आज के सभी स्लॉट बीत चुके हैं")
                        : `${t("booking", "closed")} — ${t("booking", "tomorrow")}`}
                    </p>
                  </div>
                  {dayLabel === "Aaj" && (
                    <button
                      type="button"
                      className="btn btn-warm btn-sm self-start"
                      onClick={() => setDayLabel("Kal")}
                    >
                      <CalendarCheck className="h-3 w-3" />
                      {t("booking", "bookTomorrow") || "कल के लिए बुक करें →"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {currentSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                        slotLabel === slot
                          ? "bg-[var(--warm)] text-white shadow-sm"
                          : "border border-[var(--line)] hover:border-[var(--warm)] hover:bg-[var(--warm-soft)]"
                      }`}
                      onClick={() => setSlotLabel(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Details */}
            <div className="card p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                <User className="h-3.5 w-3.5" />
                {t("booking", "step")} 3 · {t("booking", "patientDetails")}
              </p>
              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[rgba(19,49,58,0.65)]">
                      {t("booking", "patientName")} *
                    </span>
                    <input value={name} onChange={(e) => setName(e.target.value)}
                      className="input" placeholder={t("booking", "namePlaceholder")} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[rgba(19,49,58,0.65)]">
                      {t("common", "mobile")} <span className="font-normal text-[rgba(19,49,58,0.4)]">(optional)</span>
                    </span>
                    <input value={mobile} onChange={(e) => setMobile(e.target.value)}
                      inputMode="numeric" className="input" placeholder={t("booking", "mobilePlaceholder")} />
                  </label>
                </div>

                <label className="card flex items-center gap-2.5 px-3 py-2.5 text-sm text-[rgba(19,49,58,0.65)] cursor-pointer">
                  <input type="checkbox" checked={requiresPharmacyFollowUp}
                    onChange={(e) => setRequiresPharmacyFollowUp(e.target.checked)}
                    className="h-4 w-4 accent-[var(--accent)]" />
                  <Pill className="h-4 w-4 text-[var(--accent)]" />
                  {t("booking", "pharmacyFollowUp")}
                </label>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-[var(--danger-soft)] px-3 py-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[var(--danger)]" />
                    <p className="text-sm font-medium text-[var(--danger)]">{error}</p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button type="submit" className="btn btn-primary btn-lg"
                    disabled={isSubmitting || currentSlots.length === 0}>
                    {isSubmitting
                      ? <><Loader2 className="h-4 w-4 animate-spin-slow" /> {t("common", "loading")}</>
                      : <><CalendarCheck className="h-4 w-4" /> {t("booking", "confirmBtn")}</>}
                  </button>
                  <span className="badge badge-booking">
                    {dayLabel === "Aaj" ? t("booking", "today") : t("booking", "tomorrow")} · {slotLabel || "—"}
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
