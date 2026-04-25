"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Home,
  CalendarCheck,
  Ticket,
  Search,
  Monitor,
  LayoutDashboard,
  CalendarDays,
  Users,
  LogOut,
  Menu,
  X,
  Globe,
  Hospital,
} from "lucide-react";
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

  const isDoctor = session?.role === "doctor";

  /* Patient links */
  const patientLinks = [
    { href: "/", label: t("nav", "home"), icon: Home },
    ...(activeClinic?.hasBooking
      ? [{ href: "/book", label: t("nav", "booking"), icon: CalendarCheck }]
      : []),
    { href: "/walkin", label: t("nav", "walkin"), icon: Ticket },
    { href: "/status", label: t("nav", "myToken"), icon: Search },
    { href: "/live", label: t("nav", "live"), icon: Monitor },
  ];

  /* Staff quick-nav */
  const staffQuickNav = session
    ? [
        { href: "/", label: t("nav", "home"), icon: Home },
        { href: "/staff", label: t("nav", "staff"), icon: LayoutDashboard },
        { href: "/live", label: t("nav", "live"), icon: Monitor },
        { href: "/staff/schedule", label: t("nav", "schedule"), icon: CalendarDays },
        ...(isDoctor
          ? [{ href: "/staff/manage", label: t("nav", "staffMgmt"), icon: Users }]
          : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(247,239,225,0.88)] backdrop-blur-xl">
      {/* Main bar */}
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-2.5">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-[var(--accent-strong)]"
        >
          <Hospital className="h-5 w-5" />
          <span className="hidden text-sm sm:inline">SmartCare Hub</span>
        </Link>

        {/* Clinic Switcher — desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {CLINICS.map((clinic) => (
            <Link
              key={clinic.id}
              href={buildClinicHref("/", clinic.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                clinic.id === activeClinicId
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[rgba(19,49,58,0.55)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
              }`}
            >
              {clinic.shortName}
            </Link>
          ))}
        </div>

        {/* Desktop nav (patient) */}
        {!session && (
          <nav className="hidden items-center gap-0.5 lg:flex">
            {patientLinks.map((item) => (
              <Link
                key={item.href}
                href={
                  item.href === "/"
                    ? `/?clinic=${activeClinicId}`
                    : buildClinicHref(item.href, activeClinicId)
                }
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[rgba(19,49,58,0.62)] transition-all hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLang}
            className="btn btn-ghost btn-sm"
            aria-label="Toggle language"
            title={lang === "hi" ? "Switch to English" : "हिंदी में बदलें"}
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "hi" ? "EN" : "हि"}
          </button>

          <span
            className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse-dot" : "bg-red-400"}`}
            title={isOnline ? "Online" : "Offline"}
          />

          {!session && (
            <Link
              href={buildClinicHref("/staff", activeClinicId)}
              className="btn btn-primary btn-sm hidden sm:inline-flex"
            >
              {t("nav", "login")}
            </Link>
          )}

          {session && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="badge badge-booking">
                {session.role === "doctor" ? "👨‍⚕️" : "👤"} {session.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-danger btn-sm"
              >
                <LogOut className="h-3 w-3" />
                {t("nav", "logout")}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] text-sm transition-colors hover:bg-[var(--accent-soft)] lg:hidden"
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Staff icon tab bar */}
      {session && (
        <div className="border-t border-[var(--line)] bg-[rgba(19,49,58,0.025)]">
          <div className="mx-auto flex max-w-[1180px] items-center px-1">
            <nav className="flex flex-1 items-center justify-around">
              {staffQuickNav.map((item) => (
                <Link
                  key={item.href}
                  href={
                    item.href === "/"
                      ? `/?clinic=${activeClinicId}`
                      : buildClinicHref(item.href, activeClinicId)
                  }
                  className="group flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors active:bg-[var(--accent-soft)]"
                >
                  <item.icon className="h-[18px] w-[18px] text-[rgba(19,49,58,0.5)] transition-colors group-hover:text-[var(--accent-strong)]" />
                  <span className="text-[10px] font-semibold text-[rgba(19,49,58,0.55)] group-hover:text-[var(--accent-strong)]">
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 border-l border-[var(--line)] pl-2 sm:hidden">
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-danger btn-sm"
              >
                <LogOut className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[var(--line)] bg-[rgba(247,239,225,0.98)] px-4 py-3 lg:hidden animate-slide-up">
          <div className="mb-3 flex flex-wrap gap-2">
            {CLINICS.map((clinic) => (
              <Link
                key={clinic.id}
                href={buildClinicHref("/", clinic.id)}
                onClick={() => setMenuOpen(false)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  clinic.id === activeClinicId
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "border border-[var(--line)] text-[rgba(19,49,58,0.62)]"
                }`}
              >
                {clinic.shortName}
              </Link>
            ))}
          </div>

          {!session && (
            <div className="flex flex-col gap-0.5 stagger-children">
              {patientLinks.map((item) => (
                <Link
                  key={item.href}
                  href={
                    item.href === "/"
                      ? `/?clinic=${activeClinicId}`
                      : buildClinicHref(item.href, activeClinicId)
                  }
                  onClick={() => setMenuOpen(false)}
                  className="fade-up flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[rgba(19,49,58,0.75)] transition-colors hover:bg-[var(--accent-soft)]"
                >
                  <item.icon className="h-4 w-4 text-[var(--accent)]" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {session ? (
            <div className="mt-2 card p-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--accent-strong)]">
                {session.role === "doctor" ? "👨‍⚕️" : "👤"} {session.name}
              </span>
              <button
                type="button"
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="btn btn-danger btn-sm"
              >
                <LogOut className="h-3 w-3" />
                {t("nav", "logout")}
              </button>
            </div>
          ) : (
            <Link
              href={buildClinicHref("/staff", activeClinicId)}
              onClick={() => setMenuOpen(false)}
              className="btn btn-primary btn-lg mt-3 w-full justify-center"
            >
              {t("nav", "login")}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
