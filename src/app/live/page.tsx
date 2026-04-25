"use client";

import Link from "next/link";
import { useMemo } from "react";
import { buildClinicHref } from "@/features/clinic/catalog";
import { getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useLiveQueuePolling } from "@/features/clinic/hooks/use-live-queue-polling";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";

export default function LivePage() {
  const { activeClinic, activeClinicId, state: clinicState } = useClinic();
  const { t } = useLang();
  useLiveQueuePolling(5000);
  const summary = useMemo(() => getQueueSummary(clinicState), [clinicState]);
  const current = summary.current;
  const next = summary.next;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f6b63_0%,#082a33_48%,#05161d_100%)] px-4 py-6 text-white sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-5 py-4 backdrop-blur">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[rgba(255,255,255,0.5)]">
                {t("live", "waitingArea")}
              </p>
              <h1 className="display-type mt-1 text-3xl sm:text-4xl">{activeClinic.title}</h1>
              <p className="mt-1 text-sm text-[rgba(255,255,255,0.6)]">{t("live", "refreshNote")}</p>
            </div>
            <p className="text-xs text-[rgba(255,255,255,0.5)]">
              {t("live", "lastUpdated")}: {new Date(clinicState.lastUpdated).toLocaleTimeString("en-IN")}
            </p>
          </div>
        </header>

        <main className="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_22rem]">
          <section className="live-token-shadow rounded-3xl bg-[rgba(255,255,255,0.06)] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[rgba(255,255,255,0.5)]">
              {t("live", "currentToken")}
            </p>
            <div className="mt-5 rounded-2xl bg-[linear-gradient(180deg,rgba(67,182,124,0.35),rgba(17,91,72,0.55))] px-6 py-8">
              <p className="display-type text-[4rem] leading-none sm:text-[6rem] lg:text-[8rem]">
                {current?.token ?? `${activeClinic.prefix}-000`}
              </p>
              <p className="mt-3 text-xl font-semibold text-[rgba(255,255,255,0.8)]">
                {current?.name ?? t("live", "queuePreparing")}
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[rgba(255,255,255,0.06)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[rgba(255,255,255,0.5)]">
                  {t("live", "nextToken")}
                </p>
                <p className="mt-2 text-4xl font-semibold">{next?.token ?? "--"}</p>
                <p className="mt-1 text-sm text-[rgba(255,255,255,0.6)]">
                  {next?.name ?? t("live", "pleaseWait")}
                </p>
              </div>
              <div className="rounded-2xl bg-[rgba(255,255,255,0.06)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[rgba(255,255,255,0.5)]">
                  {t("live", "queueCount")}
                </p>
                <p className="mt-2 text-4xl font-semibold">{summary.waiting.length}</p>
                <p className="mt-1 text-sm text-[rgba(255,255,255,0.6)]">
                  {t("live", "patientsWaiting")}
                </p>
              </div>
            </div>
          </section>

          <aside className="live-token-shadow rounded-2xl bg-[rgba(255,255,255,0.06)] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,255,255,0.5)]">
                {t("live", "waitingList")}
              </p>
              <Link
                href={buildClinicHref("/staff", activeClinicId)}
                className="rounded-full border border-[rgba(255,255,255,0.15)] px-3 py-1 text-xs font-semibold text-[rgba(255,255,255,0.7)]"
              >
                {t("nav", "staff")}
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              {summary.waiting.slice(0, 7).map((entry, index) => (
                <div
                  key={entry.id}
                  className={`rounded-xl border px-3 py-3 ${
                    index === 0
                      ? "border-[rgba(103,237,170,0.2)] bg-[rgba(103,237,170,0.1)]"
                      : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-semibold">{entry.token}</p>
                    <span className="rounded-full bg-[rgba(255,255,255,0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(255,255,255,0.6)]">
                      {entry.source}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[rgba(255,255,255,0.65)]">{entry.name}</p>
                </div>
              ))}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
