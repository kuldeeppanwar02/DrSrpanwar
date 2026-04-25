"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CLINICS, buildClinicHref } from "@/features/clinic/catalog";
import { getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";

export default function HomePage() {
  const { activeClinic, activeClinicId, state, isOnline } = useClinic();
  const { t } = useLang();
  const summary = useMemo(() => getQueueSummary(state), [state]);

  return (
    <div className="page-shell">
      {/* Hero */}
      <section className="section-shell pt-8 pb-6">
        <div className="fade-up text-center">
          <h1 className="display-type text-3xl text-[var(--accent-strong)] sm:text-4xl">
            {t("common", "appName")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[rgba(19,49,58,0.7)]">
            {t("home", "tagline")}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={buildClinicHref("/book", activeClinicId)}
              className="focus-ring rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              {t("home", "bookBtn")}
            </Link>
            <Link
              href={buildClinicHref("/walkin", activeClinicId)}
              className="focus-ring rounded-full bg-[var(--warm)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8b4626]"
            >
              {t("home", "walkinBtn")}
            </Link>
            <Link
              href={buildClinicHref("/status", activeClinicId)}
              className="focus-ring rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            >
              {t("home", "checkStatus")}
            </Link>
          </div>
        </div>
      </section>

      {/* Live Queue Snapshot + Clinic Selector */}
      <section className="section-shell grid gap-6 pb-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Left — Clinics */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {t("home", "threeClinicPortal")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {CLINICS.map((clinic) => (
              <article
                key={clinic.id}
                className={`rounded-2xl border p-4 transition ${
                  clinic.id === activeClinicId
                    ? "border-[rgba(15,107,99,0.24)] bg-[rgba(15,107,99,0.06)]"
                    : "border-[var(--line)] bg-[rgba(255,255,255,0.6)] hover:border-[rgba(15,107,99,0.18)]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                  {clinic.shortName}
                </p>
                <h3 className="mt-2 text-base font-semibold text-[var(--accent-strong)]">
                  {clinic.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[rgba(19,49,58,0.65)]">
                  {clinic.subtitle}
                </p>
                <p className="mt-1 text-xs text-[rgba(19,49,58,0.55)]">
                  {clinic.hoursLabel}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Link
                    href={buildClinicHref("/book", clinic.id)}
                    className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white"
                  >
                    {t("nav", "booking")}
                  </Link>
                  <Link
                    href={buildClinicHref("/walkin", clinic.id)}
                    className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold"
                  >
                    {t("nav", "walkin")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Right — Live Queue */}
        <div className="fade-up-delay space-y-4">
          <div className="rounded-2xl bg-[rgba(15,107,99,0.92)] p-5 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[rgba(255,255,255,0.6)]">
              {t("home", "currentToken")}
            </p>
            <p className="display-type mt-2 text-5xl">
              {summary.current?.token ?? `${activeClinic.prefix}-000`}
            </p>
            <p className="mt-2 text-sm text-[rgba(255,255,255,0.7)]">
              {summary.current?.name ?? t("home", "queueStart")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                {t("home", "nextToken")}
              </p>
              <p className="mt-1 text-2xl font-semibold">{summary.next?.token ?? "--"}</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                {t("home", "waiting")}
              </p>
              <p className="mt-1 text-2xl font-semibold">{summary.waiting.length}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-white/60 p-3 text-xs text-[rgba(19,49,58,0.65)]">
            <p>
              {t("common", "clinic")}: <strong>{activeClinic.shortName}</strong> ·{" "}
              {isOnline ? t("home", "syncOnline") : t("home", "syncOffline")}
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="section-shell pb-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              {t("home", "contact")}
            </p>
            <div className="mt-3 space-y-1 text-sm text-[rgba(19,49,58,0.7)]">
              <p>Qtr No. 1, Behind Poonam Stadium, Officers Colony, Police Line, Jaisalmer - 345001</p>
              <p>Phone / WhatsApp: 96362 43621</p>
            </div>
            <a
              href="tel:+919636243621"
              className="focus-ring mt-3 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              {t("home", "callNow")}
            </a>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
            <iframe
              title="Panwar SmartCare Hub map"
              src="https://www.google.com/maps?q=Qtr%20No.%201%2C%20Behind%20Poonam%20Stadium%2C%20Officers%20Colony%2C%20Police%20Line%2C%20Jaisalmer%2C%20Rajasthan%20345001&output=embed"
              className="min-h-[220px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
