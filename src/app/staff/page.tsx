"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PlayCircle,
  CheckCircle2,
  PauseCircle,
  SkipForward,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ClipboardList,
  CalendarClock,
  Phone,
  UserCircle,
  Inbox,
  Lock,
  Camera,
} from "lucide-react";
import { getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";
import { getStaffSession, setStaffSession, clearStaffSession } from "@/components/navbar";
import { useToast } from "@/components/toast";
import { PrescriptionModal } from "@/components/prescription-modal";

type StaffSessionData = {
  id: string;
  name: string;
  role: "doctor" | "staff" | "pharmacist";
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
  const { t, lang } = useLang();
  const { toast } = useToast();
  const summary = useMemo(() => getQueueSummary(clinicState), [clinicState]);

  const [session, setSession] = useState<StaffSessionData | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<QueueTab>("pending");
  const [historyMap, setHistoryMap] = useState<Record<string, PatientHistorySummary>>({});
  const [emergencyMsg, setEmergencyMsg] = useState("");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [rxEntry, setRxEntry] = useState<{ id: string; token: string; name: string } | null>(null);

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
        const msg = data.message || t("staff", "invalidPin");
        setError(msg);
        toast(msg, "error");
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
      toast(`${t("staff", "welcomeBack")}, ${sessionData.name}`, "success");
    } catch {
      setError(t("staff", "invalidPin"));
      toast(t("staff", "invalidPin"), "error");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    clearStaffSession();
    setSession(null);
    window.dispatchEvent(new Event("staff-session-change"));
  };

  const runAction = async (task: () => Promise<void>, successMsg?: string) => {
    setError("");
    try {
      await task();
      if (successMsg) toast(successMsg, "success");
    } catch (actionError) {
      const msg = actionError instanceof Error ? actionError.message : "Action failed.";
      setError(msg);
      toast(msg, "error");
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
            <div className="fade-up card card-elevated p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                <Lock className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <h1 className="display-type mt-4 text-center text-xl text-[var(--accent-strong)]">
                {t("staff", "loginTitle")}
              </h1>
              <p className="mt-2 text-center text-xs text-[rgba(19,49,58,0.55)]">
                {t("staff", "loginSubtitle")}
              </p>

              <div className="mt-6">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[rgba(19,49,58,0.65)]">
                    {t("staff", "enterPin")}
                  </span>
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    type="password"
                    inputMode="numeric"
                    className="input text-center text-2xl tracking-[0.5em]"
                    placeholder="····"
                    maxLength={6}
                    onKeyDown={(e) => { if (e.key === "Enter") void login(); }}
                  />
                </label>
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--danger-soft)] px-3 py-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[var(--danger)]" />
                  <p className="text-sm font-medium text-[var(--danger)]">{error}</p>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary btn-lg mt-5 w-full justify-center"
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
        <div>
          <h1 className="display-type text-xl text-[var(--accent-strong)]">
            {t("staff", "title")} — {activeClinic.shortName}
          </h1>
          <p className="mt-1 text-xs text-[rgba(19,49,58,0.6)]">
            {t("staff", "welcomeBack")}, <strong>{session.name}</strong> ({isDoctor ? t("staff", "doctor") : t("staff", "staffRole")})
          </p>
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

        {/* ─── Daily Summary Card ─── */}
        <div className="mt-5 rounded-2xl border border-[var(--line)] overflow-hidden">
          <div className="bg-gradient-to-r from-[rgba(15,107,99,0.92)] to-[rgba(10,78,83,0.95)] px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(255,255,255,0.55)]">
                {t("staff", "dailySummary")}
              </p>
              <p className="mt-0.5 text-xs text-[rgba(255,255,255,0.7)]">
                {new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="display-type text-3xl text-white">{clinicState.queue.length}</p>
              <p className="text-[10px] text-[rgba(255,255,255,0.6)]">{t("staff", "totalPatients")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-5">
            <div className="bg-white/80 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase text-[#1f7a54]">{t("staff", "checkupDone")}</p>
              <p className="mt-1 text-xl font-bold text-[#1f7a54]">
                {clinicState.queue.filter((e) => e.status === "done").length}
              </p>
            </div>
            <div className="bg-white/80 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase text-[#8b4626]">{t("staff", "skipped")}</p>
              <p className="mt-1 text-xl font-bold text-[#8b4626]">
                {clinicState.queue.filter((e) => e.status === "skipped").length}
              </p>
            </div>
            <div className="bg-white/80 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase text-[var(--accent)]">{t("staff", "waiting")}</p>
              <p className="mt-1 text-xl font-bold">
                {clinicState.queue.filter((e) => e.status === "waiting").length}
              </p>
            </div>
            <div className="bg-white/80 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase text-[rgba(19,49,58,0.55)]">{t("staff", "holdCount")}</p>
              <p className="mt-1 text-xl font-bold">{summary.holdCount}</p>
            </div>
            <div className="bg-white/80 px-4 py-3 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-semibold uppercase text-[rgba(19,49,58,0.55)]">{t("staff", "bookings")}/{t("staff", "walkins")}</p>
              <p className="mt-1 text-xl font-bold">{summary.bookings}/{summary.walkIns}</p>
            </div>
          </div>
        </div>

        {/* Live Token Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[rgba(19,49,58,0.94)] p-4 text-white">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.55)]">{t("staff", "currentToken")}</p>
            <p className="display-type mt-2 text-3xl">{summary.current?.token ?? "--"}</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("staff", "nextToken")}</p>
            <p className="mt-2 text-2xl font-semibold">{summary.next?.token ?? "--"}</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white/70 p-4 col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("queue", "pendingCount")}</p>
            <p className="mt-2 text-2xl font-semibold">{pendingEntries.length}</p>
          </div>
        </div>

        {/* Controls — role-based */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void runAction(async () => { await advanceQueue(); }, t("staff", "advanceBtn") + " ✓")}
          >
            <PlayCircle className="h-4 w-4" />
            {t("staff", "advanceBtn")}
          </button>

          {isDoctor && (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  if (confirm(t("staff", "resetConfirm"))) {
                    void runAction(async () => { await resetClinicState(); }, t("staff", "resetQueue") + " ✓");
                  }
                }}
              >
                <RotateCcw className="h-4 w-4" />
                {t("staff", "resetQueue")}
              </button>
              <button
                type="button"
                className={clinicState.emergencyClosed ? "btn btn-primary" : "btn btn-danger"}
                onClick={() => {
                  if (clinicState.emergencyClosed) {
                    void runAction(async () => {
                      clinicState.emergencyClosed = false;
                      clinicState.emergencyMessage = "";
                    });
                  } else {
                    setEmergencyMsg(t("emergency", "defaultMessage"));
                    setShowEmergencyModal(true);
                  }
                }}
              >
                {clinicState.emergencyClosed
                  ? <><ShieldCheck className="h-4 w-4" />{t("emergency", "reopenClinic")}</>
                  : <><ShieldAlert className="h-4 w-4" />{t("emergency", "closeClinic")}</>}
              </button>
            </>
          )}
        </div>

        {/* Emergency Close Modal */}
        {showEmergencyModal && isDoctor && (
          <div className="mt-4 card p-5" style={{borderColor:'rgba(192,57,43,0.2)', background:'var(--danger-soft)'}}>
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--danger)]">
              <ShieldAlert className="h-4 w-4" /> {t("emergency", "closeClinic")}
            </p>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs font-semibold text-[rgba(19,49,58,0.65)]">
                {t("emergency", "enterMessage")}
              </span>
              <textarea
                value={emergencyMsg}
                onChange={(e) => setEmergencyMsg(e.target.value)}
                className="input"
                rows={2}
              />
            </label>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn btn-danger"
                onClick={() => {
                  clinicState.emergencyClosed = true;
                  clinicState.emergencyMessage = emergencyMsg;
                  setShowEmergencyModal(false);
                }}>
                <ShieldAlert className="h-4 w-4" /> {t("emergency", "closeClinic")}
              </button>
              <button type="button" className="btn btn-outline"
                onClick={() => setShowEmergencyModal(false)}>
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
        <div className="mt-4 card p-4">
          {tab === "pending" ? (
            pendingEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Inbox className="h-10 w-10 text-[rgba(19,49,58,0.2)]" />
                <p className="mt-3 text-sm font-medium text-[rgba(19,49,58,0.45)]">{t("staff", "noPatients")}</p>
              </div>
            ) : (
              <div className="space-y-2 stagger-children">
                {pendingEntries.map((entry) => (
                  <div key={entry.id} className="fade-up card p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2.5">
                        <span className={`queue-dot mt-2 ${entry.status}`} />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-bold">{entry.token}</span>
                            <span className={`badge ${entry.source === 'booking' ? 'badge-booking' : 'badge-walkin'}`}>
                              {entry.source}
                            </span>
                            <span className={`badge badge-${entry.status === 'in-progress' ? 'in-progress' : entry.status}`}>
                              {entry.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm font-medium">{entry.name}</p>
                          <p className="flex items-center gap-1 text-xs text-[rgba(19,49,58,0.5)]">
                            <CalendarClock className="h-3 w-3" /> {entry.dayLabel} · {entry.slotLabel}
                            {entry.mobile && <><Phone className="ml-1 h-3 w-3" /> {entry.mobile}</>}
                            {!entry.mobile && <span className="text-[rgba(19,49,58,0.35)]">{t("staff", "noMobile")}</span>}
                          </p>
                          {/* Patient history badge */}
                          {entry.mobile && historyMap[entry.mobile] && (
                            <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[var(--accent)]">
                              <ClipboardList className="h-3 w-3" /> {t("history", "totalVisits")}: {historyMap[entry.mobile].totalVisits}
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
                        <button type="button" className="btn btn-primary btn-sm"
                          onClick={() => void runAction(async () => { await updateQueueStatus(entry.id, "in-progress"); })}>
                          <PlayCircle className="h-3 w-3" /> {t("staff", "callNow")}
                        </button>
                        {isDoctor && (
                          <button type="button" className="btn btn-sm" style={{background:'var(--success)',color:'white'}}
                            onClick={() => setRxEntry({ id: entry.id, token: entry.token, name: entry.name })}>
                            <CheckCircle2 className="h-3 w-3" /> {t("staff", "doneBtn")}
                          </button>
                        )}
                        {isDoctor && (
                          <button type="button" className="btn btn-outline btn-sm"
                            onClick={() => void runAction(async () => {
                              await updateQueueStatus(entry.id, entry.status === "hold" ? "waiting" : "hold");
                            })}>
                            <PauseCircle className="h-3 w-3" /> {entry.status === "hold" ? t("staff", "resumeBtn") : t("staff", "holdBtn")}
                          </button>
                        )}
                        <button type="button" className="btn btn-ghost btn-sm"
                          onClick={() => {
                            if (confirm(t("queue", "shiftConfirm"))) {
                              void runAction(async () => { await rescheduleQueueEntry(entry.id); });
                            }
                          }}>
                          <CalendarClock className="h-3 w-3" /> {t("queue", "shiftToTomorrow")}
                        </button>
                        {isDoctor && (
                          <button type="button" className="btn btn-danger btn-sm"
                            onClick={() => void runAction(async () => { await updateQueueStatus(entry.id, "skipped"); })}>
                            <SkipForward className="h-3 w-3" /> {t("staff", "skipBtn")}
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
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-[rgba(31,122,84,0.2)]" />
                <p className="mt-3 text-sm font-medium text-[rgba(19,49,58,0.45)]">{t("queue", "noCompletedToday")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completeEntries.map((entry) => (
                  <div key={entry.id} className="card p-3 opacity-65">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`queue-dot ${entry.status}`} />
                        <span className="text-base font-bold">{entry.token}</span>
                        <span className="text-sm text-[rgba(19,49,58,0.55)]">{entry.name}</span>
                      </div>
                      <span className={`badge ${entry.status === "done" ? "badge-done" : "badge-skipped"}`}>
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

      {/* Prescription Photo Modal */}
      {rxEntry && (
        <PrescriptionModal
          tokenId={rxEntry.token}
          patientName={rxEntry.name}
          clinicId={activeClinicId}
          createdBy={session?.id || "staff"}
          onDone={() => {
            // Mark entry as done after photo sent or skipped
            void runAction(
              async () => { await updateQueueStatus(rxEntry.id, "done"); },
              t("staff", "doneBtn") + " ✓",
            );
            setRxEntry(null);
          }}
          onClose={() => setRxEntry(null)}
        />
      )}
    </div>
  );
}
