"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Search,
  Users,
  Clock,
  Hash,
  Activity,
  AlertTriangle,
  Inbox,
  CalendarClock,
} from "lucide-react";
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
          <h1 className="display-type text-center text-2xl text-[var(--accent-strong)] sm:text-3xl balance-text">
            {t("status", "title")} — {activeClinic.shortName}
          </h1>

          {/* Search */}
          <div className="mt-6 card p-5">
            <form className="flex gap-3" onSubmit={handleSubmit}>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(19,49,58,0.35)]" />
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  inputMode="numeric"
                  className="input pl-11"
                  placeholder={t("status", "enterMobilePlaceholder")}
                />
              </div>
              <button type="submit" className="btn btn-primary flex-shrink-0">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">{t("status", "checkBtn")}</span>
              </button>
            </form>
          </div>

          {/* Queue stats */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="card-elevated overflow-hidden rounded-xl">
              <div className="bg-gradient-to-br from-[rgba(19,49,58,0.92)] to-[rgba(8,42,51,0.96)] p-3 text-center text-white">
                <p className="text-[9px] uppercase tracking-widest text-[rgba(255,255,255,0.5)]">
                  <Activity className="mx-auto mb-0.5 h-3 w-3 animate-pulse-dot" />
                  {t("status", "yourToken")}
                </p>
                <p className="display-type mt-1 text-xl">{summary.current?.token ?? "--"}</p>
              </div>
            </div>
            <div className="card p-3 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("home", "nextToken")}
              </p>
              <p className="mt-1 text-xl font-bold">{summary.next?.token ?? "--"}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                <Users className="mx-auto mb-0.5 h-3 w-3" />
                {t("home", "waiting")}
              </p>
              <p className="mt-1 text-xl font-bold">{summary.waiting.length}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("common", "hold")}
              </p>
              <p className="mt-1 text-xl font-bold">{summary.holdCount}</p>
            </div>
          </div>

          {/* Result */}
          <div className="mt-6">
            {submittedMobile && !selectedEntry && (
              <div className="card flex items-center gap-2.5 p-4">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[var(--warm)]" />
                <p className="text-sm font-medium text-[#8b4626]">{t("status", "notFound")}</p>
              </div>
            )}

            {!submittedMobile && (
              <div className="card flex flex-col items-center justify-center border-dashed p-6 text-center">
                <Inbox className="h-8 w-8 text-[rgba(19,49,58,0.18)]" />
                <p className="mt-2 text-sm text-[rgba(19,49,58,0.45)]">{t("status", "enterMobile")}</p>
              </div>
            )}

            {selectedEntry && (
              <div className="fade-up space-y-3">
                <div className="card-elevated overflow-hidden rounded-2xl">
                  <div className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] p-5 text-center text-white">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.55)]">
                      {t("status", "yourToken")}
                    </p>
                    <p className="display-type mt-2 text-5xl">{selectedEntry.token}</p>
                    <span className={`mt-2 badge badge-${selectedEntry.status === 'in-progress' ? 'in-progress' : selectedEntry.status === 'done' ? 'done' : selectedEntry.status === 'hold' ? 'hold' : 'waiting'}`}>
                      {selectedEntry.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="card p-3 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                      <Hash className="mx-auto mb-0.5 h-3 w-3" />
                      {t("status", "position")}
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {selectedEntry.status === "done" ? t("status", "done") : (position?.patientsAhead ?? 0) + 1}
                    </p>
                  </div>
                  <div className="card p-3 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                      <Users className="mx-auto mb-0.5 h-3 w-3" />
                      {t("status", "patientsAhead")}
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {selectedEntry.status === "done" ? 0 : position?.patientsAhead ?? 0}
                    </p>
                  </div>
                  <div className="card p-3 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                      <Clock className="mx-auto mb-0.5 h-3 w-3" />
                      {t("status", "estWait")}
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {selectedEntry.status === "done" ? "0" : position?.estimatedWaitMinutes ?? 0} min
                    </p>
                  </div>
                </div>

                <div className="card p-4 space-y-1.5 text-sm text-[rgba(19,49,58,0.65)]">
                  <p className="flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-[var(--accent)]" />
                    {t("status", "daySlot")}: <strong>{selectedEntry.dayLabel} · {selectedEntry.slotLabel}</strong>
                  </p>
                  <p>{t("status", "bookingIdLabel")}: <strong>{selectedEntry.bookingId}</strong></p>
                  <p>{t("status", "doctorAt")}: <strong>{summary.current?.token ?? "--"}</strong></p>
                  <p className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-400"}`} />
                    {t("status", "queueMode")}: <strong>{isOnline ? t("common", "online") : t("common", "offline")}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
