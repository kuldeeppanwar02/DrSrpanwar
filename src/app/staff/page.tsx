"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildClinicHref } from "@/features/clinic/catalog";
import { getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";
import { getStaffSession, setStaffSession, clearStaffSession } from "@/components/navbar";

type StaffSessionData = {
  id: string;
  name: string;
  role: "doctor" | "staff";
  designation: string;
  clinicAccess: string[];
};

type PatientHistorySummary = {
  totalVisits: number;
  lastVisitDate: string | null;
  clinicBreakdown: Record<string, number>;
};

type QueueTab = "pending" | "complete";

export default function StaffPage() {
  const {
    activeClinic,
    activeClinicId,
    state: clinicState,
    advanceQueue,
    resetClinicState,
    rescheduleQueueEntry,
    updateQueueStatus,
  } = useClinic();
  const { t } = useLang();
  const summary = useMemo(() => getQueueSummary(clinicState), [clinicState]);

  const [session, setSession] = useState<StaffSessionData | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<QueueTab>("pending");
  const [historyMap, setHistoryMap] = useState<Record<string, PatientHistorySummary>>({});
  const [emergencyMsg, setEmergencyMsg] = useState("");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const isDoctor = session?.role === "doctor";

  // Split queue
  const pendingEntries = useMemo(
    () => clinicState.queue.filter((e) => e.status !== "done" && e.status !== "skipped"),
    [clinicState.queue],
  );
  const completeEntries = useMemo(
    () => clinicState.queue.filter((e) => e.status === "done" || e.status === "skipped"),
    [clinicState.queue],
  );

  useEffect(() => {
    const stored = getStaffSession();
    if (stored) setSession(stored);
  }, []);

  const login = async () => {
    if (!pin.trim()) {
      setError(t("staff", "enterPin"));
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/pin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t("staff", "invalidPin"));
        return;
      }
      const sessionData: StaffSessionData = {
        id: data.member.id,
        name: data.member.name,
        role: data.member.role,
        designation: data.member.designation,
        clinicAccess: data.member.clinicAccess,
      };
      setStaffSession(sessionData);
      setSession(sessionData);
      window.dispatchEvent(new Event("staff-session-change"));
      setPin("");
    } catch {
      setError(t("staff", "invalidPin"));
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    clearStaffSession();
    setSession(null);
    window.dispatchEvent(new Event("staff-session-change"));
  };

  const runAction = async (task: () => Promise<void>) => {
    setError("");
    try {
      await task();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    }
  };

  // Fetch patient history for a mobile number
  const fetchHistory = async (mobile: string) => {
    if (!mobile || mobile.length < 10 || historyMap[mobile]) return;
    try {
      const res = await fetch(`/api/patients/${mobile.replace(/\D/g, "").slice(-10)}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryMap((prev) => ({ ...prev, [mobile]: data.summary }));
      }
    } catch {
      // silent
    }
  };

  // Login Screen
  if (!session) {
    return (
      <div className="page-shell">
        <div className="section-shell flex min-h-[60vh] items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <div className="fade-up rounded-2xl border border-[var(--line)] bg-white/70 p-6">
              <h1 className="display-type text-center text-xl text-[var(--accent-strong)]">
                {t("staff", "loginTitle")}
              </h1>
              <p className="mt-2 text-center text-xs text-[rgba(19,49,58,0.6)]">
                {t("staff", "loginSubtitle")}
              </p>

              <div className="mt-6">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[rgba(19,49,58,0.7)]">
                    {t("staff", "enterPin")}
                  </span>
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    type="password"
                    inputMode="numeric"
                    className="focus-ring w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none"
                    placeholder="····"
                    maxLength={6}
                    onKeyDown={(e) => { if (e.key === "Enter") void login(); }}
                  />
                </label>
              </div>

              {error && (
                <p className="mt-3 rounded-lg bg-[rgba(182,93,54,0.1)] px-3 py-2 text-center text-sm font-semibold text-[#8b4626]">
                  {error}
                </p>
              )}

              <button
                type="button"
                className="focus-ring mt-5 w-full rounded-full bg-[var(--accent)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
                onClick={() => void login()}
                disabled={busy}
              >
                {busy ? t("staff", "loggingIn") : t("staff", "loginBtn")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="page-shell">
      <div className="section-shell py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="display-type text-xl text-[var(--accent-strong)]">
              {t("staff", "title")} — {activeClinic.shortName}
            </h1>
            <p className="mt-1 text-xs text-[rgba(19,49,58,0.6)]">
              {t("staff", "welcomeBack")}, <strong>{session.name}</strong> ({isDoctor ? t("staff", "doctor") : t("staff", "staffRole")})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isDoctor && (
              <Link
                href={buildClinicHref("/staff/manage", activeClinicId)}
                className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--accent)]"
              >
                {t("nav", "staffMgmt")}
              </Link>
            )}
            <Link
              href={buildClinicHref("/staff/schedule", activeClinicId)}
              className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--accent)]"
            >
              {t("nav", "schedule")}
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-[rgba(182,93,54,0.2)] px-3 py-1.5 text-xs font-semibold text-[#8b4626]"
            >
              {t("nav", "logout")}
            </button>
          </div>
        </div>

        {/* Emergency Banner */}
        {clinicState.emergencyClosed && (
          <div className="mt-4 rounded-xl bg-[rgba(182,93,54,0.1)] border border-[rgba(182,93,54,0.2)] px-4 py-3">
            <p className="text-sm font-semibold text-[#8b4626]">
              ⚠️ {t("emergency", "closedTitle")}
            </p>
            <p className="mt-1 text-xs text-[rgba(139,70,38,0.8)]">
              {clinicState.emergencyMessage || t("emergency", "defaultMessage")}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-[rgba(182,93,54,0.08)] px-3 py-2 text-sm text-[#8b4626]">{error}</div>
        )}

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl bg-[rgba(19,49,58,0.94)] p-4 text-white">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.55)]">{t("staff", "currentToken")}</p>
            <p className="display-type mt-2 text-3xl">{summary.current?.token ?? "--"}</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("staff", "nextToken")}</p>
            <p className="mt-2 text-2xl font-semibold">{summary.next?.token ?? "--"}</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("queue", "pendingCount")}</p>
            <p className="mt-2 text-2xl font-semibold">{pendingEntries.length}</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("queue", "completedCount")}</p>
            <p className="mt-2 text-2xl font-semibold">{completeEntries.length}</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("staff", "bookings")}/{t("staff", "walkins")}</p>
            <p className="mt-2 text-2xl font-semibold">{summary.bookings}/{summary.walkIns}</p>
          </div>
        </div>

        {/* Controls — role-based */}
        <div className="mt-4 flex flex-wrap gap-2">
          {/* Both staff and doctor can call next */}
          <button
            type="button"
            className="focus-ring rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            onClick={() => void runAction(async () => { await advanceQueue(); })}
          >
            {t("staff", "advanceBtn")}
          </button>

          {/* Doctor-only controls */}
          {isDoctor && (
            <>
              <button
                type="button"
                className="focus-ring rounded-full border border-[var(--line-strong)] px-5 py-2 text-sm font-semibold transition hover:border-[var(--accent)]"
                onClick={() => {
                  if (confirm(t("staff", "resetConfirm"))) {
                    void runAction(async () => { await resetClinicState(); });
                  }
                }}
              >
                {t("staff", "resetQueue")}
              </button>
              <button
                type="button"
                className={`focus-ring rounded-full px-5 py-2 text-sm font-semibold transition ${
                  clinicState.emergencyClosed
                    ? "bg-[var(--success)] text-white"
                    : "border border-[rgba(182,93,54,0.3)] text-[#8b4626]"
                }`}
                onClick={() => {
                  if (clinicState.emergencyClosed) {
                    // Reopen — TODO: wire to state update
                    void runAction(async () => {
                      // For now, just reset the emergency state locally
                      clinicState.emergencyClosed = false;
                      clinicState.emergencyMessage = "";
                    });
                  } else {
                    setEmergencyMsg(t("emergency", "defaultMessage"));
                    setShowEmergencyModal(true);
                  }
                }}
              >
                {clinicState.emergencyClosed ? t("emergency", "reopenClinic") : t("emergency", "closeClinic")}
              </button>
            </>
          )}
        </div>

        {/* Emergency Close Modal */}
        {showEmergencyModal && isDoctor && (
          <div className="mt-4 rounded-2xl border border-[rgba(182,93,54,0.3)] bg-[rgba(182,93,54,0.04)] p-5">
            <p className="text-sm font-semibold text-[#8b4626]">{t("emergency", "closeClinic")}</p>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-semibold text-[rgba(19,49,58,0.7)]">
                {t("emergency", "enterMessage")}
              </span>
              <textarea
                value={emergencyMsg}
                onChange={(e) => setEmergencyMsg(e.target.value)}
                className="focus-ring w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none"
                rows={2}
              />
            </label>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-full bg-[#8b4626] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  clinicState.emergencyClosed = true;
                  clinicState.emergencyMessage = emergencyMsg;
                  setShowEmergencyModal(false);
                }}
              >
                {t("emergency", "closeClinic")}
              </button>
              <button
                type="button"
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold"
                onClick={() => setShowEmergencyModal(false)}
              >
                {t("common", "cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Queue Tabs */}
        <div className="mt-6 flex gap-1 rounded-xl bg-[rgba(19,49,58,0.06)] p-1">
          <button
            type="button"
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === "pending"
                ? "bg-white text-[var(--accent-strong)] shadow-sm"
                : "text-[rgba(19,49,58,0.55)]"
            }`}
            onClick={() => setTab("pending")}
          >
            {t("queue", "pending")} ({pendingEntries.length})
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === "complete"
                ? "bg-white text-[var(--accent-strong)] shadow-sm"
                : "text-[rgba(19,49,58,0.55)]"
            }`}
            onClick={() => setTab("complete")}
          >
            {t("queue", "complete")} ({completeEntries.length})
          </button>
        </div>

        {/* Queue List */}
        <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white/60 p-5">
          {tab === "pending" ? (
            pendingEntries.length === 0 ? (
              <p className="text-sm text-[rgba(19,49,58,0.5)]">{t("staff", "noPatients")}</p>
            ) : (
              <div className="space-y-2">
                {pendingEntries.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-[var(--line)] bg-white/70 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2">
                        <span className={`queue-dot mt-1.5 ${entry.status}`} />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-semibold">{entry.token}</span>
                            <span className="rounded-full bg-[rgba(15,107,99,0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--accent-strong)]">
                              {entry.source}
                            </span>
                            <span className="rounded-full bg-[rgba(19,49,58,0.05)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[rgba(19,49,58,0.6)]">
                              {entry.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm font-medium">{entry.name}</p>
                          <p className="text-xs text-[rgba(19,49,58,0.55)]">
                            {entry.dayLabel} · {entry.slotLabel} · {entry.mobile || t("staff", "noMobile")}
                          </p>
                          {/* Patient history badge */}
                          {entry.mobile && historyMap[entry.mobile] && (
                            <p className="mt-0.5 text-[10px] font-semibold text-[var(--accent)]">
                              📋 {t("history", "totalVisits")}: {historyMap[entry.mobile].totalVisits}
                              {historyMap[entry.mobile].lastVisitDate && ` · ${t("history", "lastVisit")}: ${historyMap[entry.mobile].lastVisitDate}`}
                            </p>
                          )}
                          {/* Fetch history on first view */}
                          {entry.mobile && !historyMap[entry.mobile] && isDoctor && (
                            <button
                              type="button"
                              className="mt-0.5 text-[10px] font-semibold text-[var(--accent)] underline"
                              onClick={() => void fetchHistory(entry.mobile)}
                            >
                              {t("history", "viewHistory")}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {/* Staff + Doctor: Call Now */}
                        <button
                          type="button"
                          className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white"
                          onClick={() => void runAction(async () => { await updateQueueStatus(entry.id, "in-progress"); })}
                        >
                          {t("staff", "callNow")}
                        </button>

                        {/* Doctor-only: Done */}
                        {isDoctor && (
                          <button
                            type="button"
                            className="rounded-full bg-[var(--success)] px-3 py-1 text-xs font-semibold text-white"
                            onClick={() => void runAction(async () => { await updateQueueStatus(entry.id, "done"); })}
                          >
                            {t("staff", "doneBtn")}
                          </button>
                        )}

                        {/* Doctor-only: Hold/Resume */}
                        {isDoctor && (
                          <button
                            type="button"
                            className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold"
                            onClick={() => void runAction(async () => {
                              await updateQueueStatus(entry.id, entry.status === "hold" ? "waiting" : "hold");
                            })}
                          >
                            {entry.status === "hold" ? t("staff", "resumeBtn") : t("staff", "holdBtn")}
                          </button>
                        )}

                        {/* Shift to tomorrow */}
                        <button
                          type="button"
                          className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold"
                          onClick={() => {
                            if (confirm(t("queue", "shiftConfirm"))) {
                              void runAction(async () => { await rescheduleQueueEntry(entry.id); });
                            }
                          }}
                        >
                          {t("queue", "shiftToTomorrow")}
                        </button>

                        {/* Doctor-only: Skip */}
                        {isDoctor && (
                          <button
                            type="button"
                            className="rounded-full border border-[rgba(182,93,54,0.2)] px-3 py-1 text-xs font-semibold text-[#8b4626]"
                            onClick={() => void runAction(async () => { await updateQueueStatus(entry.id, "skipped"); })}
                          >
                            {t("staff", "skipBtn")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Complete Tab */
            completeEntries.length === 0 ? (
              <p className="text-sm text-[rgba(19,49,58,0.5)]">{t("queue", "noCompletedToday")}</p>
            ) : (
              <div className="space-y-2">
                {completeEntries.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-[var(--line)] bg-[rgba(19,49,58,0.02)] p-3 opacity-75">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`queue-dot ${entry.status}`} />
                        <span className="text-base font-semibold">{entry.token}</span>
                        <span className="text-sm text-[rgba(19,49,58,0.6)]">{entry.name}</span>
                      </div>
                      <span className="rounded-full bg-[rgba(19,49,58,0.05)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[rgba(19,49,58,0.5)]">
                        {entry.status === "done" ? t("queue", "complete") : t("staff", "skipBtn")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
