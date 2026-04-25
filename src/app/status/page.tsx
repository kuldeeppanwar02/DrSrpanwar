"use client";

import { FormEvent, useMemo, useState } from "react";
import { PrototypeShell } from "@/components/prototype-shell";
import {
  findEntriesByMobile,
  getEntryPosition,
  getQueueSummary,
} from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import type { QueueEntry } from "@/features/clinic/types";

function pickBestEntry(matches: QueueEntry[]) {
  return (
    matches.find((entry) => entry.status === "in-progress") ??
    matches.find((entry) => entry.status === "waiting") ??
    matches.find((entry) => entry.status === "hold") ??
    matches[0] ??
    null
  );
}

export default function StatusPage() {
  const { state: clinicState, isOnline, syncInFlight } = useClinic();
  const summary = useMemo(() => getQueueSummary(clinicState), [clinicState]);
  const [mobile, setMobile] = useState("");
  const [submittedMobile, setSubmittedMobile] = useState("");

  const matches = useMemo(
    () => findEntriesByMobile(submittedMobile, clinicState),
    [clinicState, submittedMobile],
  );
  const selectedEntry = pickBestEntry(matches);
  const position = selectedEntry ? getEntryPosition(clinicState, selectedEntry.id) : null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedMobile(mobile);
  };

  return (
    <PrototypeShell
      eyebrow="Token Status"
      title="मेरा टोकन / Queue Status"
      description="Patient mobile number se current token position, doctor abhi kis token par hain aur kitne patients aage hain, yeh sab ek hi page par check kar sakta hai."
      aside={
        <div className="surface-panel rounded-[2rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Status Note
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
            <li>Recent local bookings aur walk-ins is demo state mein turant दिखाई देंगे.</li>
            <li>Offline mode mein last known queue status hi dikhaya jaayega.</li>
            <li>Reception confirmation ke liye current token board bhi available hai.</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-5">
          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[rgba(19,49,58,0.78)]">
                मोबाइल नंबर
              </span>
              <input
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                inputMode="numeric"
                className="focus-ring w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none"
                placeholder="Booking / walk-in वाला mobile number"
              />
            </label>
            <button
              type="submit"
              className="focus-ring self-end rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              Status देखें
            </button>
          </form>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-[1.8rem] bg-[rgba(19,49,58,0.96)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(255,255,255,0.65)]">
              Doctor Current Token
            </p>
            <p className="display-type mt-3 text-5xl">{summary.current?.token ?? "T-000"}</p>
          </div>
          <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(255,255,255,0.76)] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
              Next Token
            </p>
            <p className="mt-3 text-4xl font-semibold">{summary.next?.token ?? "--"}</p>
          </div>
          <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(255,255,255,0.76)] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
              Waiting
            </p>
            <p className="mt-3 text-4xl font-semibold">{summary.waiting.length}</p>
          </div>
          <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(255,255,255,0.76)] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
              Hold
            </p>
            <p className="mt-3 text-4xl font-semibold">{summary.holdCount}</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-5 sm:p-6">
          {submittedMobile && !selectedEntry ? (
            <div className="rounded-[1.4rem] bg-[rgba(182,93,54,0.08)] px-4 py-4 text-sm leading-7 text-[#8b4626]">
              Is mobile number se koi token abhi nahi mila. Booking ke time wala same mobile
              number use karke dobara check karein.
            </div>
          ) : null}

          {!submittedMobile ? (
            <div className="rounded-[1.4rem] border border-dashed border-[var(--line-strong)] bg-white/50 px-4 py-4 text-sm leading-7 text-[rgba(19,49,58,0.72)]">
              Mobile number डालते ही patient-specific queue status yahan dikh jayega.
            </div>
          ) : null}

          {selectedEntry ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="space-y-4">
                <div className="rounded-[1.6rem] bg-[var(--accent)] p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.28em] text-[rgba(255,255,255,0.72)]">
                    आपका Token
                  </p>
                  <p className="display-type mt-3 text-6xl">{selectedEntry.token}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
                      Position
                    </p>
                    <p className="mt-3 text-3xl font-semibold">
                      {selectedEntry.status === "done" ? "Done" : position?.patientsAhead ?? 0}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
                      Patients Ahead
                    </p>
                    <p className="mt-3 text-3xl font-semibold">
                      {selectedEntry.status === "done" ? 0 : position?.patientsAhead ?? 0}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
                      Estimated Wait
                    </p>
                    <p className="mt-3 text-3xl font-semibold">
                      {selectedEntry.status === "done"
                        ? "0 min"
                        : `${position?.estimatedWaitMinutes ?? 0} min`}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/80 p-4 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
                  <p>
                    Status: <strong>{selectedEntry.status}</strong>
                  </p>
                  <p>
                    Booking ID: <strong>{selectedEntry.bookingId}</strong>
                  </p>
                  <p>
                    Day / Slot: <strong>{selectedEntry.dayLabel + " • " + selectedEntry.slotLabel}</strong>
                  </p>
                  <p>
                    Sync:{" "}
                    <strong>
                      {selectedEntry.syncState === "pending"
                        ? "Offline provisional token"
                        : "Synced"}
                    </strong>
                  </p>
                  <p>
                    Doctor abhi token <strong>{summary.current?.token ?? "--"}</strong> par hain.
                  </p>
                  <p>
                    Queue mode: <strong>{isOnline ? "Online" : "Offline cache view"}</strong>
                  </p>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(255,255,255,0.8)] p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
                  Recent Entries
                </p>
                {syncInFlight ? (
                  <p className="mt-3 rounded-[1rem] bg-[rgba(15,107,99,0.08)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                    Syncing updates...
                  </p>
                ) : null}
                <div className="mt-4 space-y-3">
                  {matches.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.2rem] border border-[var(--line)] bg-white/80 p-3 text-sm leading-6"
                    >
                      <p className="font-semibold">{entry.token}</p>
                      <p>{entry.dayLabel + " • " + entry.slotLabel}</p>
                      <p className="text-[rgba(19,49,58,0.66)]">
                        {entry.status} • {entry.syncState}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </PrototypeShell>
  );
}
