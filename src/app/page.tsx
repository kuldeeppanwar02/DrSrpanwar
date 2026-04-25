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
} from "lucide-react";
import { CLINICS, buildClinicHref } from "@/features/clinic/catalog";
import { getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";
import { getStaffSession } from "@/components/navbar";

export default function HomePage() {
  const { activeClinic, activeClinicId, state, isOnline } = useClinic();
  const { t } = useLang();
  const summary = useMemo(() => getQueueSummary(state), [state]);
  const [session, setSession] = useState<{ name: string; role: string; clinicAccess: string[] } | null>(null);

  useEffect(() => {
    setSession(getStaffSession());
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
      <section className="section-shell pt-8 pb-4">
        <div className="fade-up text-center">
          <p className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)]">
            <Activity className="h-3 w-3" />
            {isOnline ? t("home", "syncOnline") : t("home", "syncOffline")}
          </p>
          <h1 className="display-type mt-4 text-3xl text-[var(--accent-strong)] sm:text-4xl balance-text">
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
            <>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[rgba(19,49,58,0.65)] balance-text">
                {t("home", "tagline")}
              </p>

              {/* CTA Buttons */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {activeClinic.hasBooking && (
                  <Link
                    href={buildClinicHref("/book", activeClinicId)}
                    className="btn btn-primary btn-lg"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    {t("home", "bookBtn")}
                  </Link>
                )}
                <Link
                  href={buildClinicHref("/walkin", activeClinicId)}
                  className="btn btn-warm btn-lg"
                >
                  <Ticket className="h-4 w-4" />
                  {activeClinic.hasBooking ? t("home", "walkinBtn") : t("pharmacy", "pickupToken")}
                </Link>
                <Link
                  href={buildClinicHref("/status", activeClinicId)}
                  className="btn btn-outline btn-lg"
                >
                  <Search className="h-4 w-4" />
                  {t("home", "checkStatus")}
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══ Queue + Clinics Grid ═══ */}
      <section className="section-shell grid gap-6 pb-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Left — Clinic Cards */}
        <div>
          {!isLoggedIn && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              {t("home", "threeClinicPortal")}
            </p>
          )}
          <div className={`mt-4 grid gap-3 stagger-children ${isLoggedIn ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            {CLINICS.map((clinic) => (
              <article
                key={clinic.id}
                className={`card fade-up p-4 transition-all ${
                  clinic.id === activeClinicId ? "card-active" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                    {clinic.shortName}
                  </p>
                  {clinic.id === activeClinicId && (
                    <span className="badge badge-in-progress">Active</span>
                  )}
                </div>
                <h3 className="mt-2 text-base font-semibold text-[var(--accent-strong)]">
                  {clinic.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[rgba(19,49,58,0.6)]">
                  {clinic.subtitle}
                </p>

                <div className="mt-3 space-y-1.5">
                  <p className="flex items-center gap-1.5 text-xs text-[rgba(19,49,58,0.55)]">
                    <Clock className="h-3 w-3 text-[var(--accent)]" /> {clinic.hoursLabel}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-[rgba(19,49,58,0.55)]">
                    <MapPin className="h-3 w-3 text-[var(--accent)]" /> {clinic.locationLabel}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-[rgba(19,49,58,0.55)]">
                    <Phone className="h-3 w-3 text-[var(--accent)]" /> {clinic.phone}
                  </p>
                  {clinic.email && (
                    <p className="flex items-center gap-1.5 text-xs text-[rgba(19,49,58,0.55)]">
                      <Mail className="h-3 w-3 text-[var(--accent)]" /> {clinic.email}
                    </p>
                  )}
                </div>

                {!isLoggedIn && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {clinic.hasBooking ? (
                      <>
                        <Link
                          href={buildClinicHref("/book", clinic.id)}
                          className="btn btn-primary btn-sm"
                        >
                          <CalendarCheck className="h-3 w-3" />
                          {t("nav", "booking")}
                        </Link>
                        <Link
                          href={buildClinicHref("/walkin", clinic.id)}
                          className="btn btn-outline btn-sm"
                        >
                          <Ticket className="h-3 w-3" />
                          {t("nav", "walkin")}
                        </Link>
                      </>
                    ) : (
                      <span className="badge badge-booking">
                        {t("pharmacy", "noBookingNeeded")}
                      </span>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        {/* Right — Live Queue Status */}
        <div className="fade-up-delay space-y-3">
          {/* Current Token — hero card */}
          <div className="card-elevated overflow-hidden rounded-2xl">
            <div className="bg-gradient-to-br from-[rgba(15,107,99,0.94)] to-[rgba(8,63,70,0.97)] p-5 text-white">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[rgba(255,255,255,0.6)]">
                <Activity className="h-3 w-3 animate-pulse-dot" />
                {t("home", "currentToken")}
              </p>
              <p className="display-type mt-3 text-5xl">
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
                <a
                  href={`tel:+91${activeClinic.phone}`}
                  className="btn btn-primary btn-sm"
                >
                  <Phone className="h-3 w-3" />
                  {t("home", "callNow")}
                </a>
                {activeClinic.mapUrl && (
                  <a
                    href={activeClinic.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Google Maps
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
                  <MapPin className="h-6 w-6 text-[var(--accent)]" />
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
