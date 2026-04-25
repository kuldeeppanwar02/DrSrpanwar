"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { PrototypeShell } from "@/components/prototype-shell";
import { buildClinicHref } from "@/features/clinic/catalog";
import { getEntryPosition, getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import type { ClinicDefinition, ClinicId } from "@/features/clinic/types";

type WalkInConfirmation = {
  token: string;
  bookingId: string;
  waitMinutes: number;
  syncState: "synced" | "pending";
};

type WalkInScreenProps = {
  activeClinic: ClinicDefinition;
  activeClinicId: ClinicId;
  createWalkIn: ReturnType<typeof useClinic>["createWalkIn"];
  isOnline: boolean;
  syncInFlight: boolean;
};

function WalkInScreen({
  activeClinic,
  activeClinicId,
  createWalkIn,
  isOnline,
  syncInFlight,
}: WalkInScreenProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [requiresPharmacyFollowUp, setRequiresPharmacyFollowUp] = useState(
    activeClinicId === "pharmacy",
  );
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
      setError("Agar mobile भर रहे हैं to 10 digits use karein.");
      return;
    }

    setIsSubmitting(true);

    try {
      const nextState = await createWalkIn({
        clinicId: activeClinicId,
        name,
        mobile,
        requiresPharmacyFollowUp,
      });
      const latestEntry = nextState.queue[nextState.queue.length - 1];
      const position = getEntryPosition(nextState, latestEntry.id);
      const summary = getQueueSummary(nextState);

      setConfirmation({
        token: latestEntry.token,
        bookingId: latestEntry.bookingId,
        waitMinutes: Math.max(position?.estimatedWaitMinutes ?? 0, summary.current ? 10 : 0),
        syncState: latestEntry.syncState,
      });
      setError("");
      setName("");
      setMobile("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Token generate nahi ho paaya.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PrototypeShell
      eyebrow="QR / Walk-in Flow"
      title={`${activeClinic.shortName} ke liye walk-in token`}
      description="QR scan ke baad patient sirf naam ya mobile dekar turant token paa sakta hai. Internet weak ho to provisional token bhi save ho jayega."
      aside={
        <div className="surface-panel rounded-[2rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Walk-in Notes
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
            <li>Mobile dena better hai taki patient baad mein status check kar sake.</li>
            <li>Reception QR ko direct isi route par point karna best rahega.</li>
            <li>Token ke saath estimated wait time bhi turant milta hai.</li>
          </ul>
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-5 sm:p-6">
          <div className="max-w-2xl">
            <p className="text-sm leading-7 text-[rgba(19,49,58,0.76)]">
              {activeClinicId === "pharmacy"
                ? "Medicine pickup aur prescribed follow-up ke liye fast token entry."
                : "Walk-in patients ke liye fast entry experience, minimum fields ke saath."}
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

            {activeClinicId !== "pharmacy" ? (
              <label className="flex items-start gap-3 rounded-[1.2rem] border border-[var(--line)] bg-white/70 px-4 py-4 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
                <input
                  type="checkbox"
                  checked={requiresPharmacyFollowUp}
                  onChange={(event) => setRequiresPharmacyFollowUp(event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  Agar consultation ke baad pharmacy follow-up expected ho to is option ko on
                  karein.
                </span>
              </label>
            ) : null}

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
                      ? "Offline provisional - final sync pending"
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
              <Link
                href={buildClinicHref("/status", activeClinicId)}
                className="focus-ring inline-flex rounded-full border border-[rgba(255,255,255,0.24)] px-4 py-2 text-sm font-semibold text-white"
              >
                Queue status देखें
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.8rem] border border-dashed border-[rgba(255,255,255,0.2)] p-5 text-sm leading-7 text-[rgba(255,255,255,0.72)]">
              Token generate hone ke baad yahan number aur estimated wait dikhega.
            </div>
          )}
        </aside>
      </div>
    </PrototypeShell>
  );
}

export default function WalkInPage() {
  const { activeClinic, activeClinicId, createWalkIn, isOnline, syncInFlight } = useClinic();

  return (
    <WalkInScreen
      key={activeClinicId}
      activeClinic={activeClinic}
      activeClinicId={activeClinicId}
      createWalkIn={createWalkIn}
      isOnline={isOnline}
      syncInFlight={syncInFlight}
    />
  );
}
