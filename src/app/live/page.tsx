"use client";

import { useMemo } from "react";
import { getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useLiveQueuePolling } from "@/features/clinic/hooks/use-live-queue-polling";
import { useClinic } from "@/features/clinic/state/clinic-provider";

export default function LivePage() {
  const { state: clinicState } = useClinic();
  useLiveQueuePolling(5000);
  const summary = useMemo(() => getQueueSummary(clinicState), [clinicState]);
  const current = summary.current;
  const next = summary.next;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f6b63_0%,#082a33_48%,#05161d_100%)] px-4 py-6 text-white sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[2.2rem] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-6 py-5 backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[rgba(255,255,255,0.66)]">
                Waiting Area Screen
              </p>
              <h1 className="display-type mt-2 text-4xl sm:text-5xl">
                डॉ. सत्ताराम पंवार क्लिनिक
              </h1>
              <p className="mt-2 text-lg text-[rgba(255,255,255,0.74)]">
                कृपया token number note रखें. Staff screen se queue live update hoti rahegi.
              </p>
            </div>
            <div className="text-sm text-[rgba(255,255,255,0.66)]">
              <p>Polling every 5 sec</p>
              <p>Last updated: {new Date(clinicState.lastUpdated).toLocaleTimeString("en-IN")}</p>
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_24rem]">
          <section className="live-token-shadow rounded-[3rem] bg-[rgba(255,255,255,0.08)] p-6 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.36em] text-[rgba(255,255,255,0.62)]">
              Current Token
            </p>
            <div className="mt-6 rounded-[2.2rem] bg-[linear-gradient(180deg,rgba(67,182,124,0.38),rgba(17,91,72,0.62))] px-6 py-10">
              <p className="display-type text-[4.75rem] leading-none sm:text-[7rem] lg:text-[9rem]">
                {current?.token ?? "T-000"}
              </p>
              <p className="mt-4 text-2xl font-semibold text-[rgba(255,255,255,0.84)]">
                {current?.name ?? "Queue is preparing"}
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.8rem] bg-[rgba(255,255,255,0.08)] p-5">
                <p className="text-sm uppercase tracking-[0.32em] text-[rgba(255,255,255,0.6)]">
                  Next Token
                </p>
                <p className="mt-3 text-5xl font-semibold">{next?.token ?? "--"}</p>
                <p className="mt-2 text-lg text-[rgba(255,255,255,0.72)]">
                  {next?.name ?? "Please wait"}
                </p>
              </div>
              <div className="rounded-[1.8rem] bg-[rgba(255,255,255,0.08)] p-5">
                <p className="text-sm uppercase tracking-[0.32em] text-[rgba(255,255,255,0.6)]">
                  Queue Count
                </p>
                <p className="mt-3 text-5xl font-semibold">{summary.waiting.length}</p>
                <p className="mt-2 text-lg text-[rgba(255,255,255,0.72)]">
                  Patients in waiting list
                </p>
              </div>
            </div>
          </section>

          <aside className="live-token-shadow rounded-[2.6rem] bg-[rgba(255,255,255,0.08)] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[rgba(255,255,255,0.62)]">
              Waiting List
            </p>
            <div className="mt-5 space-y-3">
              {summary.waiting.slice(0, 7).map((entry, index) => (
                <div
                  key={entry.id}
                  className={`rounded-[1.5rem] border px-4 py-4 ${
                    index === 0
                      ? "border-[rgba(103,237,170,0.26)] bg-[rgba(103,237,170,0.14)]"
                      : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-2xl font-semibold">{entry.token}</p>
                    <span className="rounded-full bg-[rgba(255,255,255,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,255,255,0.74)]">
                      {entry.source}
                    </span>
                  </div>
                  <p className="mt-2 text-base text-[rgba(255,255,255,0.78)]">{entry.name}</p>
                  <p className="mt-1 text-sm text-[rgba(255,255,255,0.58)]">
                    {entry.dayLabel} • {entry.slotLabel}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
