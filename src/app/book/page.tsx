"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { PrototypeShell } from "@/components/prototype-shell";
import { buildClinicHref } from "@/features/clinic/catalog";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import type { ClinicDefinition, ClinicId } from "@/features/clinic/types";

const dayOptions = [
  { value: "Aaj", label: "आज / Today" },
  { value: "Kal", label: "कल / Tomorrow" },
] as const;

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

type BookingScreenProps = {
  activeClinic: ClinicDefinition;
  activeClinicId: ClinicId;
  createBooking: ReturnType<typeof useClinic>["createBooking"];
  isOnline: boolean;
  syncInFlight: boolean;
};

function BookingScreen({
  activeClinic,
  activeClinicId,
  createBooking,
  isOnline,
  syncInFlight,
}: BookingScreenProps) {
  const [dayLabel, setDayLabel] = useState<"Aaj" | "Kal">("Aaj");
  const [slotLabel, setSlotLabel] = useState(slotMap[activeClinicId].Aaj[0]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [requiresPharmacyFollowUp, setRequiresPharmacyFollowUp] = useState(
    activeClinicId === "pharmacy",
  );
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("कृपया मरीज का नाम भरें.");
      return;
    }

    if (mobile.replace(/\D/g, "").length !== 10) {
      setError("कृपया 10 digit mobile number डालें.");
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
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Booking save nahi ho paayi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PrototypeShell
      eyebrow="Booking Flow"
      title={`${activeClinic.shortName} ke liye appointment booking`}
      description="दिन चुनें, slot चुनें, naam aur mobile दर्ज करें. Confirmation ke baad booking ID aur queue token screen par mil jayega."
      aside={
        <div className="surface-panel rounded-[2rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Booking Notes
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
            <li>Confirmation ke baad booking ID ka screenshot lena best rahega.</li>
            <li>SMS ya WhatsApp reminder abhi intentionally included nahi hai.</li>
            <li>Offline hone par provisional booking save hogi aur baad mein sync hogi.</li>
          </ul>
        </div>
      }
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              Step 1
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {dayOptions.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={`focus-ring rounded-[1.5rem] px-4 py-5 text-left transition ${
                    dayLabel === day.value
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--line)] bg-white/70 hover:border-[var(--accent)]"
                  }`}
                  onClick={() => {
                    setDayLabel(day.value);
                    setSlotLabel(slotMap[activeClinicId][day.value][0]);
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                    Day Select
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{day.label}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              Step 2
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {slotMap[activeClinicId][dayLabel].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`focus-ring rounded-[1.4rem] px-4 py-4 text-left transition ${
                    slotLabel === slot
                      ? "bg-[rgba(182,93,54,0.92)] text-white"
                      : "border border-[var(--line)] bg-white/80 hover:border-[var(--warm)]"
                  }`}
                  onClick={() => setSlotLabel(slot)}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                    Available Slot
                  </p>
                  <p className="mt-2 text-xl font-semibold">{slot}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              Step 3
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[rgba(19,49,58,0.78)]">
                    मरीज का नाम
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="focus-ring w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none"
                    placeholder="जैसे: गोपी कंवर"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[rgba(19,49,58,0.78)]">
                    मोबाइल नंबर
                  </span>
                  <input
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value)}
                    inputMode="numeric"
                    className="focus-ring w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none"
                    placeholder="10 digit mobile"
                  />
                </label>
              </div>

              {activeClinicId !== "pharmacy" ? (
                <label className="flex items-start gap-3 rounded-[1.2rem] border border-[var(--line)] bg-white/70 px-4 py-4 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
                  <input
                    type="checkbox"
                    checked={requiresPharmacyFollowUp}
                    onChange={(event) => setRequiresPharmacyFollowUp(event.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    Agar post-treatment pharmacy follow-up required ho to is option ko
                    select karein.
                  </span>
                </label>
              ) : null}

              {error ? (
                <p className="rounded-[1rem] bg-[rgba(182,93,54,0.12)] px-4 py-3 text-sm font-semibold text-[#8b4626]">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="focus-ring rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Confirm Booking"}
                </button>
                <p className="text-sm text-[rgba(19,49,58,0.68)]">
                  Selected: {dayLabel} • {slotLabel} •{" "}
                  {isOnline ? "Live online save" : "Offline provisional save"}
                </p>
              </div>
            </form>
          </section>
        </div>

        <div className="rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(15,107,99,0.08),rgba(255,255,255,0.84))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Confirmation Preview
          </p>
          {confirmation ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.6rem] bg-[var(--accent)] p-5 text-white">
                <p className="text-sm uppercase tracking-[0.28em] text-[rgba(255,255,255,0.7)]">
                  Booking ID
                </p>
                <p className="mt-3 text-3xl font-semibold">{confirmation.bookingId}</p>
                <p className="mt-3 text-sm text-[rgba(255,255,255,0.76)]">
                  Queue token: {confirmation.token}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/80 p-4 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
                <p>
                  Clinic: <strong>{activeClinic.shortName}</strong>
                </p>
                <p>
                  दिन: <strong>{confirmation.dayLabel}</strong>
                </p>
                <p>
                  समय: <strong>{confirmation.slotLabel}</strong>
                </p>
                <p>
                  Sync status:{" "}
                  <strong>
                    {confirmation.syncState === "pending"
                      ? "Offline provisional - final sync pending"
                      : "Synced"}
                  </strong>
                </p>
              </div>
              {syncInFlight ? (
                <p className="rounded-[1.2rem] bg-[rgba(15,107,99,0.08)] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]">
                  Background sync chal raha hai...
                </p>
              ) : null}
              <p className="rounded-[1.2rem] bg-[rgba(182,93,54,0.08)] px-4 py-3 text-sm font-semibold text-[#8b4626]">
                कृपया booking ID ka screenshot le lijiye ya note kar lijiye.
              </p>
              <Link
                href={buildClinicHref("/status", activeClinicId)}
                className="focus-ring inline-flex rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              >
                Mera Token dekhein
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.6rem] border border-dashed border-[var(--line-strong)] bg-white/50 p-5 text-sm leading-7 text-[rgba(19,49,58,0.7)]">
              Booking confirm hote hi yahan ID, token aur screenshot note dikhega.
            </div>
          )}
        </div>
      </div>
    </PrototypeShell>
  );
}

export default function BookPage() {
  const { activeClinic, activeClinicId, createBooking, isOnline, syncInFlight } = useClinic();

  return (
    <BookingScreen
      key={activeClinicId}
      activeClinic={activeClinic}
      activeClinicId={activeClinicId}
      createBooking={createBooking}
      isOnline={isOnline}
      syncInFlight={syncInFlight}
    />
  );
}
