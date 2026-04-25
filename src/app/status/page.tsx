"use client";

import { FormEvent, useMemo, useState } from "react";
import { findEntriesByMobile, getEntryPosition, getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";
import type { QueueEntry } from "@/features/clinic/types";

function pickBestEntry(matches: QueueEntry[]) {
  return (
    matches.find((e) => e.status === "in-progress") ??
    matches.find((e) => e.status === "waiting") ??
    matches.find((e) => e.status === "hold") ??
    matches[0] ?? null
  );
}

export default function StatusPage() {
  const { activeClinic, state: clinicState, isOnline } = useClinic();
  const { t } = useLang();
  const summary = useMemo(() => getQueueSummary(clinicState), [clinicState]);
  const [mobile, setMobile] = useState("");
  const [submittedMobile, setSubmittedMobile] = useState("");

  const matches = useMemo(() => findEntriesByMobile(submittedMobile, clinicState), [clinicState, submittedMobile]);
  const selectedEntry = pickBestEntry(matches);
  const position = selectedEntry ? getEntryPosition(clinicState, selectedEntry.id) : null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedMobile(mobile);
  };

  return (
    <div className="page-shell">
      <div className="section-shell py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="display-type text-center text-2xl text-[var(--accent-strong)] sm:text-3xl">
            {t("status", "title")} — {activeClinic.shortName}
          </h1>

          {/* Search */}
          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-white/70 p-5">
            <form className="flex gap-3" onSubmit={handleSubmit}>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                inputMode="numeric"
                className="focus-ring flex-1 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none"
                placeholder={t("status", "enterMobilePlaceholder")}
              />
              <button
                type="submit"
                className="focus-ring rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                {t("status", "checkBtn")}
              </button>
            </form>
          </div>

          {/* Queue stats */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="rounded-xl bg-[rgba(19,49,58,0.94)] p-3 text-center text-white">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.55)]">
                {t("status", "yourToken")}
              </p>
              <p className="display-type mt-1 text-2xl">{summary.current?.token ?? "--"}</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white/60 p-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("home", "nextToken")}</p>
              <p className="mt-1 text-2xl font-semibold">{summary.next?.token ?? "--"}</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white/60 p-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("home", "waiting")}</p>
              <p className="mt-1 text-2xl font-semibold">{summary.waiting.length}</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white/60 p-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("common", "hold")}</p>
              <p className="mt-1 text-2xl font-semibold">{summary.holdCount}</p>
            </div>
          </div>

          {/* Result */}
          <div className="mt-6">
            {submittedMobile && !selectedEntry && (
              <div className="rounded-xl bg-[rgba(182,93,54,0.08)] px-4 py-3 text-sm text-[#8b4626]">
                {t("status", "notFound")}
              </div>
            )}

            {!submittedMobile && (
              <div className="rounded-xl border border-dashed border-[var(--line-strong)] bg-white/40 p-4 text-center text-sm text-[rgba(19,49,58,0.55)]">
                {t("status", "enterMobile")}
              </div>
            )}

            {selectedEntry && (
              <div className="fade-up space-y-4">
                <div className="rounded-2xl bg-[var(--accent)] p-5 text-center text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-[rgba(255,255,255,0.6)]">
                    {t("status", "yourToken")}
                  </p>
                  <p className="display-type mt-2 text-5xl">{selectedEntry.token}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("status", "position")}</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {selectedEntry.status === "done" ? t("status", "done") : (position?.patientsAhead ?? 0) + 1}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("status", "patientsAhead")}</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {selectedEntry.status === "done" ? 0 : position?.patientsAhead ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("status", "estWait")}</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {selectedEntry.status === "done" ? "0" : position?.estimatedWaitMinutes ?? 0} min
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-white/70 p-4 text-sm text-[rgba(19,49,58,0.7)]">
                  <p>{t("common", "status")}: <strong>{selectedEntry.status}</strong></p>
                  <p>{t("status", "bookingIdLabel")}: <strong>{selectedEntry.bookingId}</strong></p>
                  <p>{t("status", "daySlot")}: <strong>{selectedEntry.dayLabel} · {selectedEntry.slotLabel}</strong></p>
                  <p>{t("status", "doctorAt")}: <strong>{summary.current?.token ?? "--"}</strong></p>
                  <p>{t("status", "queueMode")}: <strong>{isOnline ? t("common", "online") : t("common", "offline")}</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
