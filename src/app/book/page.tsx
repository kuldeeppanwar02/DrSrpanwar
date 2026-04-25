"use client";

import { FormEvent, useState } from "react";
import { PrototypeShell } from "@/components/prototype-shell";
import { useClinic } from "@/features/clinic/state/clinic-provider";

const slotMap: Record<"आज" | "कल", string[]> = {
  आज: ["09:30 AM", "10:00 AM", "10:30 AM", "11:15 AM", "12:00 PM", "04:30 PM"],
  कल: ["09:00 AM", "09:45 AM", "10:15 AM", "11:30 AM", "01:00 PM", "05:00 PM"],
};

type BookingConfirmation = {
  bookingId: string;
  token: string;
  dayLabel: string;
  slotLabel: string;
  syncState: "synced" | "pending";
};

export default function BookPage() {
  const { createBooking, isOnline, syncInFlight } = useClinic();
  const [dayLabel, setDayLabel] = useState<"आज" | "कल">("आज");
  const [slotLabel, setSlotLabel] = useState(slotMap["आज"][0]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
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
        dayLabel,
        slotLabel,
        name,
        mobile,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PrototypeShell
      eyebrow="Booking Flow"
      title="ऑनलाइन अपॉइंटमेंट बुक करें"
      description="3 simple steps: दिन चुनें, स्लॉट चुनें, नाम और मोबाइल डालकर confirmation screen paaiye."
      aside={
        <div className="surface-panel rounded-[2rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Booking Notes
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
            <li>Confirmation ke baad Booking ID dikhegi. Screenshot le lena best rahega.</li>
            <li>SMS/WhatsApp is prototype mein intentionally use nahi kiya gaya hai.</li>
            <li>Offline hone par booking local pending state mein save ho jayegi.</li>
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
              {(["आज", "कल"] as const).map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`focus-ring rounded-[1.5rem] px-4 py-5 text-left transition ${
                    dayLabel === day
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--line)] bg-white/70 hover:border-[var(--accent)]"
                  }`}
                  onClick={() => {
                    setDayLabel(day);
                    setSlotLabel(slotMap[day][0]);
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                    Day Select
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{day}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              Step 2
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {slotMap[dayLabel].map((slot) => (
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
                  Selected: {dayLabel} • {slotLabel} • {isOnline ? "Online" : "Offline provisional"}
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
                  दिन: <strong>{confirmation.dayLabel}</strong>
                </p>
                <p>
                  समय: <strong>{confirmation.slotLabel}</strong>
                </p>
                <p>
                  Sync status:{" "}
                  <strong>
                    {confirmation.syncState === "pending"
                      ? "Offline pending - final token sync hone par update hoga"
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
            </div>
          ) : (
            <div className="mt-5 rounded-[1.6rem] border border-dashed border-[var(--line-strong)] bg-white/50 p-5 text-sm leading-7 text-[rgba(19,49,58,0.7)]">
              Booking confirm karte hi yahan par ID, token aur screenshot note दिखाई देगा.
            </div>
          )}
        </div>
      </div>
    </PrototypeShell>
  );
}
