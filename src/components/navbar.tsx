"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { CLINICS, buildClinicHref } from "@/features/clinic/catalog";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";

type StaffSession = {
  id: string;
  name: string;
  role: "doctor" | "staff";
  designation: string;
  clinicAccess: string[];
} | null;

const SESSION_KEY = "clinic-staff-session";

export function getStaffSession(): StaffSession {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StaffSession;
  } catch {
    return null;
  }
}

export function setStaffSession(session: StaffSession) {
  if (typeof window === "undefined") return;
  if (session) {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
}

export function clearStaffSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function Navbar() {
  const { activeClinicId, activeClinic, isOnline } = useClinic();
  const { lang, toggleLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<StaffSession>(null);

  useEffect(() => {
    setSession(getStaffSession());
    const handleStorage = () => setSession(getStaffSession());
    window.addEventListener("storage", handleStorage);
    // Custom event for same-tab updates
    window.addEventListener("staff-session-change", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("staff-session-change", handleStorage);
    };
  }, []);

  const handleLogout = () => {
    clearStaffSession();
    setSession(null);
    window.dispatchEvent(new Event("staff-session-change"));
  };

  const patientLinks = [
    { href: "/", label: t("nav", "home"), icon: "🏠" },
    ...(activeClinic?.hasBooking
      ? [{ href: "/book", label: t("nav", "booking"), icon: "📋" }]
      : []),
    { href: "/walkin", label: t("nav", "walkin"), icon: "🎫" },
    { href: "/status", label: t("nav", "myToken"), icon: "🔍" },
    { href: "/live", label: t("nav", "live"), icon: "📺" },
  ];

  const staffLinks = session
    ? [
        { href: "/staff", label: t("nav", "staff"), icon: "⚙️" },
        { href: "/staff/schedule", label: t("nav", "schedule"), icon: "📅" },
        ...(session.role === "doctor"
          ? [{ href: "/staff/manage", label: t("nav", "staffMgmt"), icon: "👥" }]
          : []),
      ]
    : [];

  const allLinks = [...patientLinks, ...staffLinks];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(247,239,225,0.92)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-2.5">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-[var(--accent-strong)]"
        >
          <span className="text-lg">🏥</span>
          <span className="hidden text-sm sm:inline">SmartCare Hub</span>
        </Link>

        {/* Clinic Switcher — desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {CLINICS.map((clinic) => (
            <Link
              key={clinic.id}
              href={buildClinicHref("/", clinic.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                clinic.id === activeClinicId
                  ? "bg-[var(--accent)] text-white"
                  : "text-[rgba(19,49,58,0.6)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
              }`}
            >
              {clinic.shortName}
            </Link>
          ))}
        </div>

        {/* Nav Links — desktop */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {allLinks.map((item) => (
            <Link
              key={item.href}
              href={
                item.href === "/"
                  ? `/?clinic=${activeClinicId}`
                  : buildClinicHref(item.href, activeClinicId)
              }
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-[rgba(19,49,58,0.68)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Lang toggle */}
          <button
            type="button"
            onClick={toggleLang}
            className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-bold transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            aria-label="Toggle language"
            title={lang === "hi" ? "Switch to English" : "हिंदी में बदलें"}
          >
            {lang === "hi" ? "EN" : "हि"}
          </button>

          {/* Online indicator */}
          <span
            className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-400"}`}
            title={isOnline ? "Online" : "Offline"}
          />

          {/* Staff login link — if not logged in */}
          {!session && (
            <Link
              href={buildClinicHref("/staff", activeClinicId)}
              className="hidden rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[var(--accent-strong)] sm:inline-flex"
            >
              {t("nav", "login")}
            </Link>
          )}

          {/* Staff name badge — if logged in */}
          {session && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                {session.role === "doctor" ? "👨‍⚕️" : "👤"} {session.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-[rgba(182,93,54,0.2)] px-2.5 py-1 text-xs font-semibold text-[#8b4626] transition hover:bg-[rgba(182,93,54,0.08)]"
              >
                {t("nav", "logout")}
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] text-sm lg:hidden"
            aria-label="Menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[var(--line)] bg-[rgba(247,239,225,0.98)] px-4 py-3 lg:hidden">
          {/* Clinic switcher — mobile */}
          <div className="mb-3 flex flex-wrap gap-2">
            {CLINICS.map((clinic) => (
              <Link
                key={clinic.id}
                href={buildClinicHref("/", clinic.id)}
                onClick={() => setMenuOpen(false)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  clinic.id === activeClinicId
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--line)] text-[rgba(19,49,58,0.68)]"
                }`}
              >
                {clinic.shortName}
              </Link>
            ))}
          </div>

          {/* Nav links — mobile */}
          <div className="flex flex-col gap-0.5">
            {allLinks.map((item) => (
              <Link
                key={item.href}
                href={
                  item.href === "/"
                    ? `/?clinic=${activeClinicId}`
                    : buildClinicHref(item.href, activeClinicId)
                }
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[rgba(19,49,58,0.78)] transition hover:bg-[var(--accent-soft)]"
              >
                <span className="text-xs">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Staff session — mobile */}
          {session ? (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--accent-soft)] px-3 py-2">
              <span className="text-xs font-semibold text-[var(--accent-strong)]">
                {session.role === "doctor" ? "👨‍⚕️" : "👤"} {session.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="text-xs font-semibold text-[#8b4626]"
              >
                {t("nav", "logout")}
              </button>
            </div>
          ) : (
            <Link
              href={buildClinicHref("/staff", activeClinicId)}
              onClick={() => setMenuOpen(false)}
              className="mt-3 block rounded-full bg-[var(--accent)] px-4 py-2 text-center text-sm font-semibold text-white"
            >
              {t("nav", "login")}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
