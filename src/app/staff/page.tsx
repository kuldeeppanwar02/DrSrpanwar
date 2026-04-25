"use client";

import { useEffect, useMemo, useState } from "react";
import { PrototypeShell } from "@/components/prototype-shell";
import { getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";

const DEMO_CODE = "2026";
const SESSION_KEY = "clinic-staff-demo";
const SESSION_MINUTES = 15;

export default function StaffPage() {
  const {
    state: clinicState,
    advanceQueue,
    resetClinicState,
    rescheduleQueueEntry,
    updateQueueStatus,
  } = useClinic();
  const summary = useMemo(() => getQueueSummary(clinicState), [clinicState]);
  const [passcode, setPasscode] = useState("");
  const [loggedIn, setLoggedIn] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.sessionStorage.getItem(SESSION_KEY) === "open";
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    const expireSession = () => {
      window.sessionStorage.removeItem(SESSION_KEY);
      setLoggedIn(false);
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
  }, [loggedIn]);

  const logout = () => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setLoggedIn(false);
    setPasscode("");
  };

  const login = () => {
    if (passcode !== DEMO_CODE) {
      setError("Demo access code 2026 use karein.");
      return;
    }

    window.sessionStorage.setItem(SESSION_KEY, "open");
    setLoggedIn(true);
    setError("");
  };

  if (!loggedIn) {
    return (
      <PrototypeShell
        eyebrow="Staff / Doctor Login"
        title="क्लिनिक Dashboard Access"
        description="Prototype ke liye simple demo login diya gaya hai. Production mein Firebase Auth ya role-based secure login lagega."
      >
        <div className="max-w-xl rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-6">
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
          {error ? (
            <p className="mt-4 rounded-[1rem] bg-[rgba(182,93,54,0.12)] px-4 py-3 text-sm font-semibold text-[#8b4626]">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="focus-ring rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              onClick={login}
            >
              Dashboard खोलें
            </button>
            <span className="rounded-full bg-[rgba(15,107,99,0.1)] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]">
              Prototype code: 2026
            </span>
          </div>
        </div>
      </PrototypeShell>
    );
  }

  return (
    <PrototypeShell
      eyebrow="Staff Dashboard"
      title="आज की merged queue"
      description="Bookings aur walk-ins ko ek hi queue mein dikhaya gaya hai. Next, hold, skip aur reschedule controls demo state ko turant update karte hain."
      aside={
        <div className="surface-panel rounded-[2rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Live Control
          </p>
            <button
              type="button"
              className="focus-ring mt-4 w-full rounded-[1.3rem] bg-[var(--accent)] px-4 py-3 text-left font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              onClick={() => void advanceQueue()}
            >
              Next Token Call करें
            </button>
          <button
            type="button"
            className="focus-ring mt-3 w-full rounded-[1.3rem] border border-[var(--line-strong)] px-4 py-3 text-left font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            onClick={() => void resetClinicState()}
          >
            Demo queue reset करें
          </button>
          <button
            type="button"
            className="focus-ring mt-3 w-full rounded-[1.3rem] border border-[rgba(182,93,54,0.24)] px-4 py-3 text-left font-semibold text-[#8b4626] transition hover:bg-[rgba(182,93,54,0.08)]"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      }
    >
      <div className="space-y-6">
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
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                Queue List
              </p>
              <p className="mt-2 text-sm leading-7 text-[rgba(19,49,58,0.74)]">
                `/live` screen aur patient status page isi demo state ko consume karte hain.
              </p>
            </div>
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
                      onClick={() => void updateQueueStatus(entry.id, "in-progress")}
                    >
                      Call Now
                    </button>
                    <button
                      type="button"
                      className="focus-ring rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--warm)] hover:text-[#8b4626]"
                      onClick={() =>
                        void updateQueueStatus(
                          entry.id,
                          entry.status === "hold" ? "waiting" : "hold",
                        )
                      }
                    >
                      {entry.status === "hold" ? "Resume" : "Hold"}
                    </button>
                    <button
                      type="button"
                      className="focus-ring rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                      onClick={() => void rescheduleQueueEntry(entry.id)}
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      className="focus-ring rounded-full border border-[rgba(182,93,54,0.26)] px-4 py-2 text-sm font-semibold text-[#8b4626] transition hover:bg-[rgba(182,93,54,0.08)]"
                      onClick={() => void updateQueueStatus(entry.id, "skipped")}
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
