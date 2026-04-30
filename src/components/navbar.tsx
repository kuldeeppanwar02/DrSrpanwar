"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Pill,
  BarChart,
  Download,
  Code,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CLINICS, buildClinicHref } from "@/features/clinic/catalog";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";
import { usePWAInstall } from "@/lib/use-pwa";

type StaffSession = {
  id: string;
  name: string;
  role: "doctor" | "staff" | "pharmacist";
  designation: string;
  clinicAccess: string[];
} | null;

const SESSION_KEY = "clinic-staff-session";
const TOKEN_KEY = "clinic-staff-jwt";

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

export function setStaffAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    window.sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function clearStaffSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

export function Navbar() {
  const router = useRouter();
  const { activeClinicId, activeClinic, isOnline } = useClinic();
  const { lang, toggleLang, t } = useLang();
  const { isInstallable, install, isIOS } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [developerExpanded, setDeveloperExpanded] = useState(false);
  const [session, setSession] = useState<StaffSession>(() => getStaffSession());

  useEffect(() => {
    const handleStorage = () => setSession(getStaffSession());
    window.addEventListener("storage", handleStorage);
    window.addEventListener("staff-session-change", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("staff-session-change", handleStorage);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best effort; local cleanup still happens below.
    } finally {
      clearStaffSession();
      setSession(null);
      window.dispatchEvent(new Event("staff-session-change"));
      setMenuOpen(false);
      router.replace(buildClinicHref("/", activeClinicId));
    }
  };

  const isDoctor = session?.role === "doctor";
  const isPharmacist = session?.role === "pharmacist";

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
        ...(isPharmacist
          ? [{ href: "/pharmacy", label: t("nav", "pharmacy") || "Pharmacy", icon: Pill }]
          : [{ href: "/staff", label: t("nav", "staff"), icon: LayoutDashboard }]),
        { href: "/live", label: t("nav", "live"), icon: Monitor },
        ...(isDoctor
          ? [
              { href: "/pharmacy", label: t("nav", "pharmacy") || "Pharmacy", icon: Pill },
              { href: "/staff/schedule", label: t("nav", "schedule"), icon: CalendarDays },
              { href: "/staff/manage", label: t("nav", "staffMgmt"), icon: Users },
              { href: "/staff/reports", label: t("nav", "reports") || "Reports", icon: BarChart },
              { href: "/staff/settings", label: "Settings", icon: Hospital },
            ]
          : []),
        ...(!isPharmacist && !isDoctor
          ? [
              { href: "/staff/schedule", label: t("nav", "schedule"), icon: CalendarDays },
              { href: "/staff/reports", label: t("nav", "reports") || "Reports", icon: BarChart },
            ]
          : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(247,239,225,0.88)] backdrop-blur-xl pt-[env(safe-area-inset-top)]">
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
          {/* Online status indicator */}
          <div 
            className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold transition-colors ${
              isOnline 
                ? "border-[rgba(73,181,109,0.3)] bg-[rgba(220,250,228,0.6)] text-[var(--success)]" 
                : "border-[rgba(192,57,43,0.3)] bg-[rgba(250,220,220,0.6)] text-[var(--danger)]"
            }`}
            title={isOnline ? "System is Online & Syncing" : "Offline Cached Mode"}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse-dot" : "bg-red-500"}`} />
            <span className="hidden xs:inline">{isOnline ? "Online" : "Offline"}</span>
          </div>

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
                onClick={() => {
                  void handleLogout();
                }}
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
                  className="group flex flex-1 flex-col items-center justify-start gap-1 py-1.5 min-h-[54px] transition-colors active:bg-[var(--accent-soft)]"
                >
                  <div className="flex h-[20px] items-center justify-center">
                    <item.icon className="h-[18px] w-[18px] text-[rgba(19,49,58,0.5)] transition-colors group-hover:text-[var(--accent-strong)]" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-center leading-[1.1] px-0.5 text-[rgba(19,49,58,0.55)] group-hover:text-[var(--accent-strong)] w-full flex-1 flex items-center justify-center">
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 border-l border-[var(--line)] pl-2 sm:hidden">
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
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
              
              {/* Manual Install Trigger */}
              {(isInstallable || isIOS) && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (isIOS) {
                      setShowIOSInstructions(true);
                    } else {
                      install();
                    }
                  }}
                  className="fade-up flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--accent-strong)] bg-[rgba(103,237,170,0.1)] transition-colors hover:bg-[rgba(103,237,170,0.2)] mt-1 border border-[rgba(103,237,170,0.2)]"
                >
                  <Download className="h-4 w-4 text-[var(--accent)]" />
                  ऐप इंस्टॉल करें (Install App)
                </button>
              )}
            </div>
          )}

          {session ? (
            <div className="mt-2 card p-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--accent-strong)]">
                {session.role === "doctor" ? "👨‍⚕️" : "👤"} {session.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                  setMenuOpen(false);
                }}
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

          {/* Developer Section (Accordion) */}
          <div className="mt-4 border-t border-[rgba(19,49,58,0.1)] pt-3">
            <button
              onClick={() => setDeveloperExpanded(!developerExpanded)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-[rgba(19,49,58,0.7)] transition-colors hover:bg-[rgba(19,49,58,0.05)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  <Code className="h-4 w-4" />
                </div>
                <span>👨‍💻 App Developer Contact</span>
              </div>
              {developerExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {developerExpanded && (
              <div className="mt-2 flex flex-col gap-2 pl-3 pr-2 pb-2 animate-slide-up">
                <a
                  href="tel:+919358752147"
                  className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-[rgba(19,49,58,0.85)] shadow-sm border border-[rgba(19,49,58,0.05)] hover:bg-green-50 transition-colors"
                >
                  <Phone className="h-4 w-4 text-green-600" />
                  <span>Call: 9358752147</span>
                </a>
                <a
                  href="mailto:panwarkuldeep256@gmail.com?subject=Enquiry for Smart Clinic App"
                  className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-[rgba(19,49,58,0.85)] shadow-sm border border-[rgba(19,49,58,0.05)] hover:bg-blue-50 transition-colors"
                >
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="truncate">panwarkuldeep256@gmail.com</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* iOS Instructions Modal (Same as Banner but scoped to Navbar for manual clicks) */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">ऐप इंस्टॉल करें</h3>
              <button onClick={() => setShowIOSInstructions(false)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 text-gray-700 font-medium">
              <p>अपने iPhone में आसानी से ऐप डालने के लिए:</p>
              <ol className="list-decimal pl-5 space-y-3">
                <li>स्क्रीन के नीचे दिए गए <strong>Share</strong> बटन (चौकोर बॉक्स से ऊपर जाता हुआ तीर) को दबाएं।</li>
                <li>थोड़ा नीचे स्क्रॉल करें और <strong>"Add to Home Screen"</strong> चुनें।</li>
                <li>सबसे ऊपर दाईं ओर <strong>"Add"</strong> पर टैप करें।</li>
              </ol>
            </div>
            <button 
              onClick={() => setShowIOSInstructions(false)}
              className="mt-6 w-full rounded-2xl bg-[var(--accent)] py-3.5 font-bold text-white transition-transform active:scale-95 shadow-lg shadow-[var(--accent)]/30"
            >
              समझ गया
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
