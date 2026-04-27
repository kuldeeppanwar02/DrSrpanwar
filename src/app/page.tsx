"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  CalendarCheck,
  Clock,
  ExternalLink,
  HeartPulse,
  Mail,
  MapPin,
  Monitor,
  Phone,
  Pill,
  Search,
  ShieldCheck,
  Stethoscope,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { CLINICS, buildClinicHref } from "@/features/clinic/catalog";
import { getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";
import { type TranslationKey } from "@/i18n/translations";
import { getStaffSession } from "@/components/navbar";
import type { ClinicDefinition, ClinicId } from "@/features/clinic/types";

type TrustPoint = {
  label: string;
  detail: string;
  icon: LucideIcon;
};

const TRUST_POINTS: Record<ClinicId, TrustPoint[]> = {
  surgery: [
    { label: "10+ Years", detail: "Clinical Experience", icon: Award },
    { label: "ATLS", detail: "Trauma Certified", icon: ShieldCheck },
    { label: "Jaisalmer", detail: "Specialist Surgical Care", icon: HeartPulse },
  ],
  dental: [
    { label: "Dental Care", detail: "Appointments Available", icon: Award },
    { label: "Family", detail: "Comfort-focused Visits", icon: ShieldCheck },
    { label: "Daily", detail: "Clean & Guided Follow-up", icon: HeartPulse },
  ],
  pharmacy: [
    { label: "Trusted", detail: "Post-consult Pickup", icon: Award },
    { label: "Support", detail: "Follow-up Medicines", icon: ShieldCheck },
    { label: "Daily", detail: "Easy Local Access", icon: HeartPulse },
  ],
};

function ClinicIcon({ id, className }: { id: string; className?: string }) {
  switch (id) {
    case "surgery":
      return <Stethoscope className={className} />;
    case "pharmacy":
      return <Pill className={className} />;
    default:
      return <CalendarCheck className={className} />;
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
      {state.emergencyClosed && (
        <div className="border-b border-[rgba(192,57,43,0.15)] bg-[var(--danger-soft)]">
          <div className="section-shell py-3 text-center">
            <p className="text-sm font-semibold text-[var(--danger)]">
              {t("emergency", "closedTitle")} - {activeClinic.shortName}
            </p>
            <p className="mt-1 text-xs text-[rgba(192,57,43,0.7)]">
              {state.emergencyMessage || t("emergency", "defaultMessage")}
            </p>
          </div>
        </div>
      )}

      <section className="section-shell pt-6 pb-4">
        <div className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(255,255,255,0.85)] bg-[linear-gradient(180deg,rgba(255,252,246,0.98),rgba(248,239,223,0.95))] px-5 py-6 shadow-[0_24px_60px_rgba(30,27,19,0.08)] sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(15,107,99,0.06),transparent)]" />
          <div className="pointer-events-none absolute -left-10 top-22 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(234,192,124,0.24),transparent_70%)] blur-xl" />
          <div className="pointer-events-none absolute -right-12 -top-10 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(15,107,99,0.12),transparent_72%)] blur-xl" />

          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-[rgba(73,181,109,0.3)] bg-[rgba(220,250,228,0.9)] px-4 py-2 text-sm font-semibold text-[var(--success)] shadow-[0_10px_24px_rgba(73,181,109,0.08)]">
              <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-400"}`} />
              {isOnline ? "Now Online" : "Offline Cached Mode"}
            </p>

            <div className="mt-5 max-w-4xl">
              <h1 className="display-type balance-text text-[2.6rem] leading-[0.96] text-[#1c1913] sm:text-[4rem]">
                {t("common", "appName")}
              </h1>
              {isLoggedIn ? (
                <p className="mt-4 max-w-2xl text-base text-[rgba(19,49,58,0.68)]">
                  {t("staff", "welcomeBack")}, <strong>{session?.name}</strong>.{" "}
                  {isDoctor ? t("staff", "doctor") : t("staff", "staffRole")} access active for{" "}
                  <strong>{activeClinic.shortName}</strong>.
                </p>
              ) : (
                <p className="mt-4 max-w-2xl text-base leading-7 text-[rgba(19,49,58,0.68)]">
                  Choose your clinic, book an appointment, take a walk-in token, or track live queue status without waiting at reception.
                </p>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CLINICS.map((clinic) => {
                const active = clinic.id === activeClinicId;
                return (
                  <Link
                    key={clinic.id}
                    href={buildClinicHref("/", clinic.id)}
                    className={`focus-ring flex min-h-[4rem] items-center justify-center rounded-full border px-4 py-3 text-lg font-semibold transition-all ${
                      active
                        ? "border-transparent bg-[linear-gradient(135deg,var(--accent-deep),var(--accent))] text-white shadow-[0_18px_38px_rgba(15,107,99,0.26)]"
                        : "border-[rgba(12,86,81,0.55)] bg-[rgba(255,252,246,0.84)] text-[var(--accent-strong)] shadow-[0_8px_24px_rgba(30,27,19,0.04)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,107,99,0.12)]"
                    }`}
                  >
                    {clinic.shortName}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell grid gap-5 pb-8 xl:grid-cols-[minmax(0,1.1fr)_0.9fr]">
        <FocusedClinicCard clinic={activeClinic} isLoggedIn={isLoggedIn} t={t} />

        <div className="space-y-4">
          <QueueSnapshotCard
            clinic={activeClinic}
            currentToken={summary.current?.token ?? `${activeClinic.prefix}-000`}
            nextToken={summary.next?.token ?? "--"}
            waitingCount={summary.waiting.length}
            currentName={summary.current?.name ?? "Queue preparing"}
            t={t}
          />

          {!isLoggedIn && (
            <div className="card-elevated rounded-[1.9rem] p-5">
              <p className="label-type text-[var(--accent)]">Other Clinics</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {CLINICS.filter((clinic) => clinic.id !== activeClinicId).map((clinic) => (
                  <Link
                    key={clinic.id}
                    href={buildClinicHref("/", clinic.id)}
                    className="flex items-center gap-3 rounded-[1.4rem] border border-[rgba(12,86,81,0.08)] bg-[rgba(255,255,255,0.84)] px-4 py-4 shadow-[0_12px_28px_rgba(30,27,19,0.05)] transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                      <ClinicIcon id={clinic.id} className="h-5 w-5 text-[var(--accent)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold text-[var(--accent-strong)]">{clinic.shortName}</p>
                      <p className="truncate text-xs text-[rgba(19,49,58,0.52)]">{clinic.title}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[rgba(19,49,58,0.35)]" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {!isLoggedIn && (
        <section className="section-shell pb-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card-elevated rounded-[1.9rem] p-5">
              <p className="label-type text-[var(--accent)]">
                {t("home", "contact")} - {activeClinic.shortName}
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[rgba(19,49,58,0.72)]">
                <p className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                  <span>{activeClinic.locationLabel}</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                  <span>{activeClinic.phone}</span>
                </p>
                {activeClinic.email && (
                  <p className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                    <span>{activeClinic.email}</span>
                  </p>
                )}
                <p className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                  <span>{activeClinic.hoursLabel}</span>
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <a href={`tel:+91${activeClinic.phone}`} className="btn btn-primary btn-sm">
                  <Phone className="h-3 w-3" /> {t("home", "callNow")}
                </a>
                {activeClinic.mapUrl && (
                  <a
                    href={activeClinic.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    <ExternalLink className="h-3 w-3" /> Google Maps
                  </a>
                )}
              </div>
            </div>

            {activeClinic.mapUrl ? (
              <div className="card overflow-hidden rounded-[1.9rem]">
                <iframe
                  title={`${activeClinic.title} map`}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3574.0!2d70.905228!3d26.9126519!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3947bf85998998d1%3A0x9b5b327f625d9421!2sDR%20SATTARAM%20PANWAR!5e0!3m2!1sen!2sin!4v1"
                  className="min-h-[260px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="card-elevated flex min-h-[260px] flex-col items-center justify-center rounded-[1.9rem] p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                  <ClinicIcon id={activeClinicId} className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <p className="mt-4 text-lg font-semibold text-[var(--accent-strong)]">{activeClinic.title}</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-[rgba(19,49,58,0.62)]">{activeClinic.subtitle}</p>
                {!activeClinic.hasBooking && (
                  <span className="badge badge-booking mt-4">{t("pharmacy", "noBookingNeeded")}</span>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function QueueSnapshotCard({
  clinic,
  currentToken,
  nextToken,
  waitingCount,
  currentName,
  t,
}: {
  clinic: ClinicDefinition;
  currentToken: string;
  nextToken: string;
  waitingCount: number;
  currentName: string;
  t: (section: TranslationKey, key: string) => string;
}) {
  return (
    <div className="card-elevated overflow-hidden rounded-[1.9rem]">
      <div className="bg-[linear-gradient(145deg,rgba(10,78,83,0.98),rgba(15,107,99,0.96))] p-5 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[rgba(255,255,255,0.58)]">
          Queue Snapshot
        </p>
        <p className="display-type mt-3 text-5xl tracking-tight">{currentToken}</p>
        <p className="mt-2 text-sm text-[rgba(255,255,255,0.76)]">{currentName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        <MiniStat label={t("home", "nextToken")} value={nextToken} />
        <MiniStat label={t("home", "waiting")} value={`${waitingCount}`} />
      </div>

      <div className="px-4 pb-4">
        <Link href={buildClinicHref("/live", clinic.id)} className="btn btn-outline w-full justify-center">
          <Monitor className="h-4 w-4" /> {t("nav", "live")}
        </Link>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-[rgba(12,86,81,0.08)] bg-[rgba(255,255,255,0.84)] p-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--accent-strong)]">{value}</p>
    </div>
  );
}

function FocusedClinicCard({
  clinic,
  isLoggedIn,
  t,
}: {
  clinic: ClinicDefinition;
  isLoggedIn: boolean;
  t: (section: TranslationKey, key: string) => string;
}) {
  const isSurgeryClinic = clinic.id === "surgery";
  const trustPoints = TRUST_POINTS[clinic.id];

  return (
    <div className="card-elevated overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.78)]">
      <div className="p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(145deg,rgba(15,107,99,0.12),rgba(255,243,220,0.92))] shadow-[0_12px_28px_rgba(15,107,99,0.08)]">
            <ClinicIcon id={clinic.id} className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="label-type text-[var(--accent)]">{clinic.shortName}</p>
            <h2 className="display-type mt-3 text-[2.45rem] leading-[0.94] text-[#17130f] sm:text-[4rem]">
              {clinic.title}
            </h2>

            <div
              className={`mt-4 inline-flex max-w-3xl rounded-full px-5 py-3 text-center shadow-[0_14px_32px_rgba(183,138,63,0.16)] ${
                isSurgeryClinic
                  ? "bg-[linear-gradient(135deg,#b99043,#d9bc73)] text-white"
                  : "bg-[linear-gradient(135deg,rgba(15,107,99,0.12),rgba(15,107,99,0.2))] text-[var(--accent-strong)]"
              }`}
            >
              <p className="w-full text-lg font-medium leading-7 sm:text-[1.3rem] sm:leading-8">{clinic.subtitle}</p>
            </div>

            {clinic.metaLine && (
              <p className="mt-4 text-xl font-semibold tracking-[0.02em] text-[#17130f]">
                {clinic.metaLine}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-2.5 text-sm leading-6 text-[rgba(19,49,58,0.72)]">
          <p className="flex items-start gap-2.5">
            <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
            <span>{clinic.hoursLabel}</span>
          </p>
          <p className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
            <span>{clinic.locationLabel}</span>
          </p>
          <a
            href={`tel:+91${clinic.phone}`}
            className="flex items-center gap-2.5 font-semibold text-[var(--accent-strong)] hover:underline"
          >
            <Phone className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
            <span>{clinic.phone}</span>
          </a>
        </div>

        {!isLoggedIn && (
          <div className="mt-7 space-y-3">
            {clinic.hasBooking ? (
              <>
                <Link href={buildClinicHref("/book", clinic.id)} className="btn btn-primary min-h-[4rem] w-full justify-center text-xl">
                  <CalendarCheck className="h-5 w-5" /> {t("home", "bookBtn")}
                </Link>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link href={buildClinicHref("/walkin", clinic.id)} className="btn btn-warm min-h-[4rem] justify-center text-lg">
                    <Ticket className="h-5 w-5" /> {t("home", "walkinBtn")}
                  </Link>
                  <Link href={buildClinicHref("/status", clinic.id)} className="btn btn-outline min-h-[4rem] justify-center text-lg">
                    <Search className="h-5 w-5" /> {t("home", "checkStatus")}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link href={buildClinicHref("/walkin", clinic.id)} className="btn btn-warm min-h-[4rem] w-full justify-center text-xl">
                  <Ticket className="h-5 w-5" /> {t("pharmacy", "pickupToken")}
                </Link>
                <Link href={buildClinicHref("/status", clinic.id)} className="btn btn-outline min-h-[4rem] w-full justify-center text-lg">
                  <Search className="h-5 w-5" /> {t("home", "checkStatus")}
                </Link>
              </>
            )}
          </div>
        )}

        <div className="mt-8 border-t border-[rgba(12,86,81,0.08)] pt-5">
          <p className="text-sm font-semibold text-[rgba(19,49,58,0.82)]">Trust Strip</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {trustPoints.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3 rounded-[1.3rem] bg-[rgba(255,249,240,0.9)] px-3 py-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[#bb9447]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#17130f]">{item.label}</p>
                    <p className="text-sm leading-5 text-[rgba(19,49,58,0.72)]">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!clinic.hasBooking && (
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2">
            <Pill className="h-4 w-4 text-[var(--accent)]" />
            <p className="text-xs font-medium text-[var(--accent-strong)]">{t("pharmacy", "noBookingNeeded")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
