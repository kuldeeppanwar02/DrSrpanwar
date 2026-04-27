"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Ticket,
  Search,
  Phone,
  MapPin,
  Clock,
  Mail,
  ExternalLink,
  Activity,
  Users,
  CheckCircle2,
  Stethoscope,
  Pill,
  ArrowRight,
  Monitor,
} from "lucide-react";
import { CLINICS, buildClinicHref } from "@/features/clinic/catalog";
import { getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";
import { type TranslationKey } from "@/i18n/translations";
import { getStaffSession } from "@/components/navbar";
import type { ClinicDefinition } from "@/features/clinic/types";

/** Pick the best icon for a clinic */
function ClinicIcon({ id, className }: { id: string; className?: string }) {
  switch (id) {
    case "surgery": return <Stethoscope className={className} />;
    case "pharmacy": return <Pill className={className} />;
    default: return <CalendarCheck className={className} />;
  }
}

export default function HomePage() {
  const { activeClinic, activeClinicId, state, isOnline } = useClinic();
  const { t } = useLang();
  const summary = useMemo(() => getQueueSummary(state), [state]);
  const [session, setSession] = useState<{ name: string; role: string; clinicAccess: string[] } | null>(
    () => getStaffSession(),
  );

  useEffect(() => {
    const sync = () => setSession(getStaffSession());
    window.addEventListener("staff-session-change", sync);
    return () => window.removeEventListener("staff-session-change", sync);
  }, []);

  const isDoctor = session?.role === "doctor";
  const isStaff = session?.role === "staff";
  const isLoggedIn = isDoctor || isStaff;

  return (
    <div className="page-shell">
      {/* Emergency Banner */}
      {state.emergencyClosed && (
        <div className="bg-[var(--danger-soft)] border-b border-[rgba(192,57,43,0.15)]">
          <div className="section-shell py-3 text-center">
            <p className="text-sm font-semibold text-[var(--danger)]">
              ⚠️ {t("emergency", "closedTitle")} — {activeClinic.shortName}
            </p>
            <p className="mt-1 text-xs text-[rgba(192,57,43,0.7)]">
              {state.emergencyMessage || t("emergency", "defaultMessage")}
            </p>
          </div>
        </div>
      )}

      {/* ═══ Hero Section ═══ */}
      <section className="section-shell pt-8 pb-2">
        <div className="fade-up text-center">
          <p className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)]">
            <Activity className="h-3 w-3" />
            {isOnline ? t("home", "syncOnline") : t("home", "syncOffline")}
          </p>
          <h1 className="display-type mt-5 text-3xl text-[var(--accent-strong)] sm:text-4xl balance-text">
            {t("common", "appName")}
          </h1>

          {isLoggedIn ? (
            <div className="mt-3">
              <p className="text-sm text-[rgba(19,49,58,0.65)]">
                {t("staff", "welcomeBack")}, <strong>{session?.name}</strong>
              </p>
              <p className="mt-1 text-xs text-[rgba(19,49,58,0.45)]">
                {isDoctor ? t("staff", "doctor") : t("staff", "staffRole")} · {activeClinic.title}
              </p>
            </div>
          ) : (
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[rgba(19,49,58,0.65)] balance-text">
              {t("home", "tagline")}
            </p>
          )}
        </div>
      </section>

      {/* ═══ Clinic Switcher Tabs ═══ */}
      <section className="section-shell pb-2">
        <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
          {CLINICS.map((clinic) => (
            <Link
              key={clinic.id}
              href={buildClinicHref("/", clinic.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                clinic.id === activeClinicId
                  ? "bg-gradient-to-r from-[var(--accent-deep)] to-[var(--accent)] text-white shadow-md scale-[1.02]"
                  : "card hover:shadow-md"
              }`}
            >
              <ClinicIcon id={clinic.id} className="h-4 w-4" />
              {clinic.shortName}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ Focused Clinic View ═══ */}
      <section className="section-shell grid gap-5 pb-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Left — Active Clinic Detail */}
        <div className="space-y-5">
          {/* Clinic Hero Card */}
          <FocusedClinicCard
            clinic={activeClinic}
            isLoggedIn={isLoggedIn}
            t={t}
          />

          {/* Other Clinics — mini switcher row */}
          {!isLoggedIn && (
            <div>
              <p className="label-type text-[rgba(19,49,58,0.4)]">
                {t("home", "otherClinics") || "Other Clinics"}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 stagger-children">
                {CLINICS.filter((c) => c.id !== activeClinicId).map((clinic) => (
                  <Link
                    key={clinic.id}
                    href={buildClinicHref("/", clinic.id)}
                    className="card fade-up flex items-center gap-3 p-3 transition-all hover:card-active"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                      <ClinicIcon id={clinic.id} className="h-4 w-4 text-[var(--accent)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--accent-strong)] truncate">{clinic.shortName}</p>
                      <p className="text-[10px] text-[rgba(19,49,58,0.5)] truncate">{clinic.title}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-[rgba(19,49,58,0.25)]" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Live Queue Status */}
        <div className="fade-up-delay space-y-3">
          {/* Current Token — hero card */}
          <div className="card-elevated overflow-hidden rounded-2xl">
            <div className="bg-gradient-to-br from-[rgba(15,107,99,0.94)] to-[rgba(8,63,70,0.97)] p-5 text-white">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[rgba(255,255,255,0.55)]">
                <Activity className="h-3 w-3 animate-pulse-dot" />
                {t("home", "currentToken")}
              </p>
              <p className="display-type mt-3 text-5xl tracking-tight">
                {summary.current?.token ?? `${activeClinic.prefix}-000`}
              </p>
              <p className="mt-2 text-sm text-[rgba(255,255,255,0.7)]">
                {summary.current?.name ?? t("home", "queueStart")}
              </p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2">
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
                <CheckCircle2 className="mx-auto mb-0.5 h-3 w-3" />
                {t("queue", "completedCount")}
              </p>
              <p className="mt-1 text-xl font-bold text-[var(--success)]">
                {state.queue.filter((e) => e.status === "done").length}
              </p>
            </div>
          </div>

          {/* Sync indicator */}
          <div className="card p-3 text-xs text-[rgba(19,49,58,0.6)]">
            <p className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse-dot" : "bg-red-400"}`} />
              {t("common", "clinic")}: <strong>{activeClinic.shortName}</strong> ·{" "}
              {isOnline ? t("home", "syncOnline") : t("home", "syncOffline")}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Contact + Map — Patients only ═══ */}
      {!isLoggedIn && (
        <section className="section-shell pb-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                {t("home", "contact")} · {activeClinic.shortName}
              </p>
              <div className="mt-4 space-y-2.5">
                <p className="flex items-center gap-2.5 text-sm text-[rgba(19,49,58,0.7)]">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                  {activeClinic.locationLabel}
                </p>
                <p className="flex items-center gap-2.5 text-sm text-[rgba(19,49,58,0.7)]">
                  <Phone className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                  {activeClinic.phone}
                </p>
                {activeClinic.email && (
                  <p className="flex items-center gap-2.5 text-sm text-[rgba(19,49,58,0.7)]">
                    <Mail className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                    {activeClinic.email}
                  </p>
                )}
                <p className="flex items-center gap-2.5 text-sm text-[rgba(19,49,58,0.7)]">
                  <Clock className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                  {activeClinic.hoursLabel}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`tel:+91${activeClinic.phone}`} className="btn btn-primary btn-sm">
                  <Phone className="h-3 w-3" /> {t("home", "callNow")}
                </a>
                {activeClinic.mapUrl && (
                  <a href={activeClinic.mapUrl} target="_blank" rel="noopener noreferrer"
                    className="btn btn-outline btn-sm">
                    <ExternalLink className="h-3 w-3" /> Google Maps
                  </a>
                )}
              </div>
            </div>
            {activeClinic.mapUrl ? (
              <div className="card overflow-hidden">
                <iframe
                  title={`${activeClinic.title} map`}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3574.0!2d70.905228!3d26.9126519!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3947bf85998998d1%3A0x9b5b327f625d9421!2sDR%20SATTARAM%20PANWAR!5e0!3m2!1sen!2sin!4v1"
                  className="min-h-[220px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                  <ClinicIcon id={activeClinicId} className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--accent-strong)]">{activeClinic.title}</p>
                <p className="mt-1 text-xs leading-5 text-[rgba(19,49,58,0.6)]">{activeClinic.subtitle}</p>
                {!activeClinic.hasBooking && (
                  <span className="badge badge-booking mt-3">
                    {t("pharmacy", "noBookingNeeded")}
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   FOCUSED CLINIC CARD — main content block
   ═══════════════════════════════════════════ */
function FocusedClinicCard({
  clinic,
  isLoggedIn,
  t,
}: {
  clinic: ClinicDefinition;
  isLoggedIn: boolean;
  t: (section: TranslationKey, key: string) => string;
}) {
  return (
    <div className="card card-active fade-up overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--warm)] to-[var(--gold)]" />

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
            <ClinicIcon id={clinic.id} className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="label-type text-[var(--accent)]">
              {clinic.shortName}
            </p>
            <h2 className="heading-serif mt-0.5 text-lg text-[var(--accent-strong)] leading-tight">
              {clinic.title}
            </h2>
            <p className="mt-0.5 text-xs text-[rgba(19,49,58,0.55)]">{clinic.subtitle}</p>
          </div>
        </div>

        {/* Info row */}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
          <p className="flex items-center gap-1.5 text-xs text-[rgba(19,49,58,0.6)]">
            <Clock className="h-3 w-3 text-[var(--accent)]" /> {clinic.hoursLabel}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-[rgba(19,49,58,0.6)]">
            <MapPin className="h-3 w-3 text-[var(--accent)]" /> {clinic.locationLabel}
          </p>
          <a href={`tel:+91${clinic.phone}`} className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-semibold hover:underline">
            <Phone className="h-3 w-3" /> {clinic.phone}
          </a>
          {clinic.email && (
            <p className="flex items-center gap-1.5 text-xs text-[rgba(19,49,58,0.6)]">
              <Mail className="h-3 w-3 text-[var(--accent)]" /> {clinic.email}
            </p>
          )}
        </div>

        {/* CTA Buttons */}
        {!isLoggedIn && (
          <div className="mt-5 flex flex-wrap gap-2">
            {clinic.hasBooking ? (
              <>
                <Link href={buildClinicHref("/book", clinic.id)} className="btn btn-primary">
                  <CalendarCheck className="h-4 w-4" /> {t("home", "bookBtn")}
                </Link>
                <Link href={buildClinicHref("/walkin", clinic.id)} className="btn btn-warm">
                  <Ticket className="h-4 w-4" /> {t("home", "walkinBtn")}
                </Link>
              </>
            ) : (
              <Link href={buildClinicHref("/walkin", clinic.id)} className="btn btn-warm">
                <Ticket className="h-4 w-4" /> {t("pharmacy", "pickupToken")}
              </Link>
            )}
            <Link href={buildClinicHref("/status", clinic.id)} className="btn btn-outline">
              <Search className="h-4 w-4" /> {t("home", "checkStatus")}
            </Link>
            <Link href={buildClinicHref("/live", clinic.id)} className="btn btn-ghost">
              <Monitor className="h-4 w-4" /> {t("nav", "live")}
            </Link>
          </div>
        )}

        {/* Pharmacy note */}
        {!clinic.hasBooking && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2">
            <Pill className="h-4 w-4 text-[var(--accent)]" />
            <p className="text-xs font-medium text-[var(--accent-strong)]">
              {t("pharmacy", "noBookingNeeded")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
