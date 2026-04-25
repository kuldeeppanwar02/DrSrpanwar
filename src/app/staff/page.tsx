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
              {t("staff", "welcomeBack")}, <strong>{session.name}</strong> ({session.role === "doctor" ? t("staff", "doctor") : t("staff", "staffRole")})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.role === "doctor" && (
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

        {error && (
          <div className="mt-4 rounded-lg bg-[rgba(182,93,54,0.08)] px-3 py-2 text-sm text-[#8b4626]">{error}</div>
        )}

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-[rgba(19,49,58,0.94)] p-4 text-white">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.55)]">{t("staff", "currentToken")}</p>
            <p className="display-type mt-2 text-3xl">{summary.current?.token ?? "--"}</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("staff", "nextToken")}</p>
            <p className="mt-2 text-2xl font-semibold">{summary.next?.token ?? "--"}</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("staff", "bookings")}</p>
            <p className="mt-2 text-2xl font-semibold">{summary.bookings}</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">{t("staff", "walkins")}</p>
            <p className="mt-2 text-2xl font-semibold">{summary.walkIns}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="focus-ring rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            onClick={() => void runAction(async () => { await advanceQueue(); })}
          >
            {t("staff", "advanceBtn")}
          </button>
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
        </div>

        {/* Queue List */}
        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-white/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {t("staff", "queueList")}
          </p>

          {clinicState.queue.length === 0 ? (
            <p className="mt-4 text-sm text-[rgba(19,49,58,0.5)]">{t("staff", "noPatients")}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {clinicState.queue.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-[var(--line)] bg-white/70 p-3"
                >
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
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white"
                        onClick={() => void runAction(async () => { await updateQueueStatus(entry.id, "in-progress"); })}
                      >
                        {t("staff", "callNow")}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold"
                        onClick={() => void runAction(async () => {
                          await updateQueueStatus(entry.id, entry.status === "hold" ? "waiting" : "hold");
                        })}
                      >
                        {entry.status === "hold" ? t("staff", "resumeBtn") : t("staff", "holdBtn")}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold"
                        onClick={() => void runAction(async () => { await rescheduleQueueEntry(entry.id); })}
                      >
                        {t("staff", "rescheduleBtn")}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-[rgba(182,93,54,0.2)] px-3 py-1 text-xs font-semibold text-[#8b4626]"
                        onClick={() => void runAction(async () => { await updateQueueStatus(entry.id, "skipped"); })}
                      >
                        {t("staff", "skipBtn")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
