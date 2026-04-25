"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { buildClinicHref } from "@/features/clinic/catalog";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";
import type { ClinicId } from "@/features/clinic/types";

const dayOptions = ["Aaj", "Kal"] as const;

const slotMap: Record<ClinicId, Record<"Aaj" | "Kal", string[]>> = {
  surgery: {
    Aaj: ["09:30 AM", "10:00 AM", "10:30 AM", "11:15 AM", "12:00 PM", "04:30 PM"],
    Kal: ["09:00 AM", "09:45 AM", "10:15 AM", "11:30 AM", "01:00 PM", "05:00 PM"],
  },
  dental: {
    Aaj: ["10:00 AM", "10:30 AM", "11:00 AM", "12:15 PM", "03:30 PM", "05:15 PM"],
    Kal: ["09:30 AM", "10:15 AM", "11:45 AM", "01:15 PM", "04:00 PM", "05:30 PM"],
  },
  pharmacy: {
    Aaj: ["09:15 AM", "10:45 AM", "12:30 PM", "02:30 PM", "04:00 PM", "05:30 PM"],
    Kal: ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "04:30 PM", "05:45 PM"],
  },
};

type BookingConfirmation = {
  bookingId: string;
  token: string;
  dayLabel: string;
  slotLabel: string;
  syncState: "synced" | "pending";
};

export default function BookPage() {
  const { activeClinic, activeClinicId, createBooking, isOnline, syncInFlight } = useClinic();
  const { t } = useLang();
  const [dayLabel, setDayLabel] = useState<"Aaj" | "Kal">("Aaj");
  const [slotLabel, setSlotLabel] = useState(slotMap[activeClinicId].Aaj[0]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [requiresPharmacyFollowUp, setRequiresPharmacyFollowUp] = useState(activeClinicId === "pharmacy");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t("booking", "nameRequired"));
      return;
    }
    if (mobile.replace(/\D/g, "").length !== 10) {
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
        mobile,
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
                      setSlotLabel(slotMap[activeClinicId][day][0]);
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
              <div className="mt-3 grid grid-cols-3 gap-2">
                {slotMap[activeClinicId][dayLabel].map((slot) => (
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
                      {t("booking", "patientName")}
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
                      {t("common", "mobile")}
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

                {activeClinicId !== "pharmacy" && (
                  <label className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white/60 px-3 py-2.5 text-sm text-[rgba(19,49,58,0.7)]">
                    <input
                      type="checkbox"
                      checked={requiresPharmacyFollowUp}
                      onChange={(e) => setRequiresPharmacyFollowUp(e.target.checked)}
                      className="h-4 w-4"
                    />
                    {t("booking", "pharmacyFollowUp")}
                  </label>
                )}

                {error && (
                  <p className="rounded-lg bg-[rgba(182,93,54,0.1)] px-3 py-2 text-sm font-semibold text-[#8b4626]">
                    {error}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="focus-ring rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("common", "loading") : t("booking", "confirmBtn")}
                  </button>
                  <span className="text-xs text-[rgba(19,49,58,0.55)]">
                    {dayLabel === "Aaj" ? t("booking", "today") : t("booking", "tomorrow")} · {slotLabel}
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
