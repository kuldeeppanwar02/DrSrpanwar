"use client";

import { useEffect, useMemo, useState } from "react";
import { onIdTokenChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { PrototypeShell } from "@/components/prototype-shell";
import { hasFirebaseClientConfig } from "@/config/env";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import { getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";

const DEMO_CODE = "2026";
const SESSION_KEY = "clinic-staff-demo";
const JWT_KEY = "clinic-staff-jwt";
const SESSION_MINUTES = 15;

export default function StaffPage() {
  const liveAuthEnabled = hasFirebaseClientConfig();
  const {
    activeClinic,
    state: clinicState,
    advanceQueue,
    resetClinicState,
    rescheduleQueueEntry,
    updateQueueStatus,
  } = useClinic();
  const summary = useMemo(() => getQueueSummary(clinicState), [clinicState]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passcode, setPasscode] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [loggedIn, setLoggedIn] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !liveAuthEnabled && window.sessionStorage.getItem(SESSION_KEY) === "open";
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!liveAuthEnabled) {
      return;
    }

    const auth = getFirebaseClientAuth();
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        window.sessionStorage.removeItem(JWT_KEY);
        setStaffEmail("");
        setLoggedIn(false);
        return;
      }

      const token = await user.getIdToken();
      window.sessionStorage.setItem(JWT_KEY, token);
      setStaffEmail(user.email ?? "");
      setLoggedIn(true);
    });

    return () => unsubscribe();
  }, [liveAuthEnabled]);

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    const expireSession = () => {
      if (liveAuthEnabled) {
        void signOut(getFirebaseClientAuth());
        window.sessionStorage.removeItem(JWT_KEY);
      } else {
        window.sessionStorage.removeItem(SESSION_KEY);
        setLoggedIn(false);
      }
    };

    let timeoutId = window.setTimeout(expireSession, SESSION_MINUTES * 60 * 1000);
    const bumpSession = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(expireSession, SESSION_MINUTES * 60 * 1000);
    };

    window.addEventListener("pointerdown", bumpSession);
    window.addEventListener("keydown", bumpSession);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("pointerdown", bumpSession);
      window.removeEventListener("keydown", bumpSession);
    };
  }, [loggedIn, liveAuthEnabled]);

  const logout = async () => {
    if (liveAuthEnabled) {
      await signOut(getFirebaseClientAuth());
      window.sessionStorage.removeItem(JWT_KEY);
      setStaffEmail("");
      setLoggedIn(false);
      return;
    }

    window.sessionStorage.removeItem(SESSION_KEY);
    setLoggedIn(false);
    setPasscode("");
  };

  const login = async () => {
    setError("");
    setBusy(true);

    try {
      if (liveAuthEnabled) {
        if (!email.trim() || !password) {
          setError("Staff email aur password दोनों required hain.");
          return;
        }

        await signInWithEmailAndPassword(getFirebaseClientAuth(), email, password);
        return;
      }

      if (passcode !== DEMO_CODE) {
        setError("Demo access code 2026 use karein.");
        return;
      }

      window.sessionStorage.setItem(SESSION_KEY, "open");
      setLoggedIn(true);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Login failed. Staff account check karein.",
      );
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (task: () => Promise<void>) => {
    setError("");

    try {
      await task();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Staff action complete nahi ho paaya.",
      );
    }
  };

  if (!loggedIn) {
    return (
      <PrototypeShell
        eyebrow="Staff / Doctor Login"
        title={`${activeClinic.shortName} dashboard access`}
        description={
          liveAuthEnabled
            ? "Firebase email/password login enabled hai. Sirf allowed staff emails ko dashboard access milega."
            : "Firebase config aane tak demo login available hai. Production mein isi screen par real staff login chalega."
        }
      >
        <div className="max-w-xl rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-6">
          {liveAuthEnabled ? (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[rgba(19,49,58,0.78)]">
                  Staff email
                </span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  className="focus-ring w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none"
                  placeholder="staff@clinic.com"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[rgba(19,49,58,0.78)]">
                  Password
                </span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  className="focus-ring w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none"
                  placeholder="Password"
                />
              </label>
            </div>
          ) : (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[rgba(19,49,58,0.78)]">
                Demo staff code
              </span>
              <input
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                type="password"
                className="focus-ring w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none"
                placeholder="Enter 2026"
              />
            </label>
          )}

          {error ? (
            <p className="mt-4 rounded-[1rem] bg-[rgba(182,93,54,0.12)] px-4 py-3 text-sm font-semibold text-[#8b4626]">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="focus-ring rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-70"
              onClick={() => void login()}
              disabled={busy}
            >
              {busy ? "Logging in..." : "Dashboard खोलें"}
            </button>
            {!liveAuthEnabled ? (
              <span className="rounded-full bg-[rgba(15,107,99,0.1)] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]">
                Demo code: 2026
              </span>
            ) : null}
          </div>
        </div>
      </PrototypeShell>
    );
  }

  return (
    <PrototypeShell
      eyebrow="Staff Dashboard"
      title={`${activeClinic.shortName} live queue control`}
      description="Bookings aur walk-ins ko ek hi queue mein dikhaya gaya hai. Next, hold, skip aur reschedule controls same live state ko update karte hain."
      aside={
        <div className="surface-panel rounded-[2rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Staff Control
          </p>
          {staffEmail ? (
            <p className="mt-3 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
              Logged in as <strong>{staffEmail}</strong>
            </p>
          ) : null}
          <button
            type="button"
            className="focus-ring mt-4 w-full rounded-[1.3rem] bg-[var(--accent)] px-4 py-3 text-left font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            onClick={() => void runAction(async () => advanceQueue().then(() => undefined))}
          >
            Next Token Call करें
          </button>
          <button
            type="button"
            className="focus-ring mt-3 w-full rounded-[1.3rem] border border-[var(--line-strong)] px-4 py-3 text-left font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            onClick={() => void runAction(async () => resetClinicState().then(() => undefined))}
          >
            Queue reset करें
          </button>
          <button
            type="button"
            className="focus-ring mt-3 w-full rounded-[1.3rem] border border-[rgba(182,93,54,0.24)] px-4 py-3 text-left font-semibold text-[#8b4626] transition hover:bg-[rgba(182,93,54,0.08)]"
            onClick={() => void logout()}
          >
            Logout
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-[1.4rem] bg-[rgba(182,93,54,0.08)] px-4 py-4 text-sm leading-7 text-[#8b4626]">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.8rem] bg-[rgba(19,49,58,0.96)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(255,255,255,0.65)]">
              Current
            </p>
            <p className="display-type mt-3 text-5xl">{summary.current?.token ?? "--"}</p>
          </div>
          <div className="rounded-[1.8rem] border border-[var(--line)] bg-white/80 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Next</p>
            <p className="mt-3 text-3xl font-semibold">{summary.next?.token ?? "--"}</p>
          </div>
          <div className="rounded-[1.8rem] border border-[var(--line)] bg-white/80 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Bookings</p>
            <p className="mt-3 text-3xl font-semibold">{summary.bookings}</p>
          </div>
          <div className="rounded-[1.8rem] border border-[var(--line)] bg-white/80 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Walk-ins</p>
            <p className="mt-3 text-3xl font-semibold">{summary.walkIns}</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              Queue List
            </p>
            <p className="mt-2 text-sm leading-7 text-[rgba(19,49,58,0.74)]">
              Staff dashboard, patient status aur live queue screen isi data ko consume karte
              hain.
            </p>
          </div>

          <div className="space-y-3">
            {clinicState.queue.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-4"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-start gap-3">
                    <span className={`queue-dot ${entry.status}`} />
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-2xl font-semibold">{entry.token}</p>
                        <span className="rounded-full bg-[rgba(15,107,99,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                          {entry.source}
                        </span>
                        <span className="rounded-full bg-[rgba(19,49,58,0.06)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(19,49,58,0.76)]">
                          {entry.status}
                        </span>
                        {entry.requiresPharmacyFollowUp ? (
                          <span className="rounded-full bg-[rgba(182,93,54,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8b4626]">
                            Pharmacy {entry.pharmacyStatus}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-base font-semibold">{entry.name}</p>
                      <p className="mt-1 text-sm leading-6 text-[rgba(19,49,58,0.72)]">
                        {entry.dayLabel} • {entry.slotLabel} • {entry.mobile || "No mobile"}
                      </p>
                      {entry.notes ? (
                        <p className="mt-1 text-sm text-[rgba(182,93,54,0.88)]">{entry.notes}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="focus-ring rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                      onClick={() =>
                        void runAction(async () =>
                          updateQueueStatus(entry.id, "in-progress").then(() => undefined),
                        )
                      }
                    >
                      Call Now
                    </button>
                    <button
                      type="button"
                      className="focus-ring rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--warm)] hover:text-[#8b4626]"
                      onClick={() =>
                        void runAction(async () =>
                          updateQueueStatus(
                            entry.id,
                            entry.status === "hold" ? "waiting" : "hold",
                          ).then(() => undefined),
                        )
                      }
                    >
                      {entry.status === "hold" ? "Resume" : "Hold"}
                    </button>
                    <button
                      type="button"
                      className="focus-ring rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                      onClick={() =>
                        void runAction(async () =>
                          rescheduleQueueEntry(entry.id).then(() => undefined),
                        )
                      }
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      className="focus-ring rounded-full border border-[rgba(182,93,54,0.26)] px-4 py-2 text-sm font-semibold text-[#8b4626] transition hover:bg-[rgba(182,93,54,0.08)]"
                      onClick={() =>
                        void runAction(async () =>
                          updateQueueStatus(entry.id, "skipped").then(() => undefined),
                        )
                      }
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PrototypeShell>
  );
}
