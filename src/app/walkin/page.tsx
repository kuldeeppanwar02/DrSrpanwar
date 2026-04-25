"use client";

import { FormEvent, useState } from "react";
import { PrototypeShell } from "@/components/prototype-shell";
import { getEntryPosition, getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";

type WalkInConfirmation = {
  token: string;
  bookingId: string;
  waitMinutes: number;
  syncState: "synced" | "pending";
};

export default function WalkInPage() {
  const { createWalkIn, isOnline, syncInFlight } = useClinic();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<WalkInConfirmation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() && mobile.replace(/\D/g, "").length === 0) {
      setError("नाम ya mobile mein se कम से कम ek detail भरें.");
      return;
    }

    if (mobile && mobile.replace(/\D/g, "").length > 0 && mobile.replace(/\D/g, "").length !== 10) {
      setError("अगर mobile भर रहे हैं to 10 digits use करें.");
      return;
    }

    setIsSubmitting(true);

    try {
      const nextState = await createWalkIn({ name, mobile });
      const latestEntry = nextState.queue[nextState.queue.length - 1];
      const position = getEntryPosition(nextState, latestEntry.id);
      const summary = getQueueSummary(nextState);

      setConfirmation({
        token: latestEntry.token,
        bookingId: latestEntry.bookingId,
        waitMinutes: Math.max(position?.estimatedWaitMinutes ?? 0, summary.current ? 12 : 0),
        syncState: latestEntry.syncState,
      });
      setError("");
      setName("");
      setMobile("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PrototypeShell
      eyebrow="QR / Walk-in Flow"
      title="Walk-in Token लें"
      description="Reception QR scan karne ke baad patient sirf naam ya mobile daal kar turant token paa sakta hai."
      aside={
        <div className="surface-panel rounded-[2rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Walk-in Notes
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
            <li>Mobile देना better hai taaki patient baad mein status check kar sake.</li>
            <li>QR scan ke baad direct isi page par land karwana ideal रहेगा.</li>
            <li>Token ke saath estimated wait time bhi दिखाया जा रहा है.</li>
          </ul>
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-5 sm:p-6">
          <div className="max-w-2xl">
            <p className="text-sm leading-7 text-[rgba(19,49,58,0.76)]">
              QR scan karne ke baad yahi page khulega. Patient ko fast entry experience dene ke
              liye form ko minimum fields par rakha gaya hai.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[rgba(19,49,58,0.78)]">
                  नाम
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="focus-ring w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none"
                  placeholder="जैसे: रूप कंवर"
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
                  placeholder="Optional but recommended"
                />
              </label>
            </div>

            {error ? (
              <p className="rounded-[1rem] bg-[rgba(182,93,54,0.12)] px-4 py-3 text-sm font-semibold text-[#8b4626]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="focus-ring rounded-full bg-[var(--warm)] px-6 py-3 font-semibold text-white transition hover:bg-[#8b4626] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Generating..." : "Generate Token"}
            </button>
            <p className="text-sm text-[rgba(19,49,58,0.68)]">
              {isOnline ? "Online queue mode" : "Offline provisional token mode"}
            </p>
          </form>
        </section>

        <aside className="rounded-[2rem] border border-[var(--line)] bg-[rgba(19,49,58,0.96)] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(255,255,255,0.7)]">
            Generated Token
          </p>
          {confirmation ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.8rem] bg-[rgba(255,255,255,0.08)] p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-[rgba(255,255,255,0.66)]">
                  Token
                </p>
                <p className="display-type mt-3 text-6xl">{confirmation.token}</p>
              </div>
              <div className="rounded-[1.4rem] bg-[rgba(255,255,255,0.08)] p-4 text-sm leading-7 text-[rgba(255,255,255,0.8)]">
                <p>
                  Reference ID: <strong>{confirmation.bookingId}</strong>
                </p>
                <p>
                  Estimated wait: <strong>{confirmation.waitMinutes} minutes</strong>
                </p>
                <p>
                  Status:{" "}
                  <strong>
                    {confirmation.syncState === "pending"
                      ? "Offline provisional - sync hone par final token milega"
                      : "Synced"}
                  </strong>
                </p>
              </div>
              {syncInFlight ? (
                <p className="rounded-[1.2rem] bg-[rgba(255,255,255,0.1)] px-4 py-3 text-sm font-semibold text-[rgba(255,255,255,0.86)]">
                  Sync in progress...
                </p>
              ) : null}
              <p className="rounded-[1.2rem] bg-[rgba(235,193,125,0.16)] px-4 py-3 text-sm font-semibold text-[rgba(255,255,255,0.86)]">
                Apna token number note kar lijiye ya screenshot le lijiye.
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.8rem] border border-dashed border-[rgba(255,255,255,0.2)] p-5 text-sm leading-7 text-[rgba(255,255,255,0.72)]">
              Token generate hone ke baad yahan par number aur estimated wait dikhega.
            </div>
          )}
        </aside>
      </div>
    </PrototypeShell>
  );
}
