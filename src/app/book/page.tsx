"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  surgery: ["09:30 AM", "10:00 AM", "10:30 AM", "11:15 AM", "12:00 PM", "04:30 PM"],
  dental: ["10:00 AM", "10:30 AM", "11:00 AM", "12:15 PM", "03:30 PM", "05:15 PM"],
};

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
            <p className="text-4xl">💊</p>
            <h1 className="display-type mt-4 text-xl text-[var(--accent-strong)]">
              {t("pharmacy", "infoTitle")}
            </h1>
            <p className="mt-3 text-sm text-[rgba(19,49,58,0.65)]">
              {t("pharmacy", "noBookingNeeded")}
            </p>
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-white/70 p-4 text-left text-sm text-[rgba(19,49,58,0.7)]">
              <p>📍 {activeClinic.locationLabel}</p>
              <p>🕐 {activeClinic.hoursLabel}</p>
              <p>📞 {activeClinic.phone}</p>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href={buildClinicHref("/walkin", activeClinicId)}
                className="rounded-full bg-[var(--warm)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                {t("pharmacy", "pickupToken")}
              </Link>
              <Link
                href={buildClinicHref("/", activeClinicId)}
                className="rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-sm font-semibold"
              >
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
    () => scheduleSlots[dayLabel] || defaultSlots[activeClinicId] || [],
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
            <div className="fade-up rounded-2xl border border-[var(--line)] bg-white/70 p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--success)]">
                ✓ {t("booking", "confirmed")}
              </p>
              <div className="mt-5 rounded-xl bg-[var(--accent)] p-5 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-[rgba(255,255,255,0.65)]">
                  {t("booking", "token")}
                </p>
                <p className="display-type mt-2 text-5xl">{confirmation.token}</p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-[rgba(19,49,58,0.7)]">
                <p>{t("booking", "bookingId")}: <strong>{confirmation.bookingId}</strong></p>
                <p>{confirmation.dayLabel} · {confirmation.slotLabel}</p>
                <p>{t("common", "clinic")}: <strong>{activeClinic.shortName}</strong></p>
                <p className="text-xs">
                  {confirmation.syncState === "pending" ? t("booking", "pending") : t("booking", "synced")}
                </p>
              </div>
              {syncInFlight && (
                <p className="mt-3 text-xs font-semibold text-[var(--accent)]">{t("home", "syncing")}...</p>
              )}
              <p className="mt-4 rounded-lg bg-[rgba(182,93,54,0.08)] px-3 py-2 text-xs font-semibold text-[#8b4626]">
                {t("booking", "screenshotNote")}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <a
                  href={buildWhatsAppUrl(
                    activeClinic.shortName,
                    confirmation.token,
                    confirmation.dayLabel === "Aaj" ? t("booking", "today") : t("booking", "tomorrow"),
                    confirmation.slotLabel,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1da851]"
                >
                  {t("whatsapp", "shareBtn")}
                </a>
                <Link
                  href={buildClinicHref("/status", activeClinicId)}
                  className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--accent)]"
                >
                  {t("booking", "viewToken")}
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmation(null)}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("booking", "bookAnother")}
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

          <div className="mt-8 space-y-6">
            {/* Step 1: Day */}
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
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
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                {t("booking", "step")} 2 · {t("booking", "chooseSlot")}
              </p>
              {loadingSlots ? (
                <p className="mt-3 text-sm text-[rgba(19,49,58,0.5)]">{t("common", "loading")}</p>
              ) : currentSlots.length === 0 ? (
                <p className="mt-3 rounded-lg bg-[rgba(182,93,54,0.08)] px-3 py-2 text-sm text-[#8b4626]">
                  {t("booking", "closed")} — {dayLabel === "Aaj" ? t("booking", "today") : t("booking", "tomorrow")}
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {currentSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                        slotLabel === slot
                          ? "bg-[var(--warm)] text-white"
                          : "border border-[var(--line)] hover:border-[var(--warm)]"
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
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                {t("booking", "step")} 3 · {t("booking", "patientDetails")}
              </p>
              <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-[rgba(19,49,58,0.7)]">
                      {t("booking", "patientName")} *
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="focus-ring w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none"
                      placeholder={t("booking", "namePlaceholder")}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-[rgba(19,49,58,0.7)]">
                      {t("common", "mobile")} <span className="text-[rgba(19,49,58,0.4)] font-normal">(optional)</span>
                    </span>
                    <input
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      inputMode="numeric"
                      className="focus-ring w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none"
                      placeholder={t("booking", "mobilePlaceholder")}
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white/60 px-3 py-2.5 text-sm text-[rgba(19,49,58,0.7)]">
                  <input
                    type="checkbox"
                    checked={requiresPharmacyFollowUp}
                    onChange={(e) => setRequiresPharmacyFollowUp(e.target.checked)}
                    className="h-4 w-4"
                  />
                  {t("booking", "pharmacyFollowUp")}
                </label>

                {error && (
                  <p className="rounded-lg bg-[rgba(182,93,54,0.1)] px-3 py-2 text-sm font-semibold text-[#8b4626]">
                    {error}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="focus-ring rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
                    disabled={isSubmitting || currentSlots.length === 0}
                  >
                    {isSubmitting ? t("common", "loading") : t("booking", "confirmBtn")}
                  </button>
                  <span className="text-xs text-[rgba(19,49,58,0.55)]">
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
