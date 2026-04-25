"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CLINICS, buildClinicHref } from "@/features/clinic/catalog";
import { getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";

const features = [
  "एक ही वेबसाइट से Surgery, Dental aur Pharmacy teenon ka access",
  "QR scan se walk-in token aur mobile se queue status",
  "Weak internet ke liye offline-safe provisional flow",
  "Staff ke liye live dashboard aur next-token controls",
];

const workflow = [
  "Home par clinic choose karo",
  "बुकिंग, Walk-in ya मेरा टोकन खोलो",
  "नाम + मोबाइल do aur screenshot-friendly token lo",
  "Staff dashboard se live queue आगे बढ़ती रहेगी",
];

export default function HomePage() {
  const { activeClinic, activeClinicId, state, isOnline, syncInFlight } = useClinic();
  const summary = useMemo(() => getQueueSummary(state), [state]);

  return (
    <div className="page-shell overflow-x-hidden">
      <header className="section-shell pt-6">
        <div className="surface-panel rounded-[2rem] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
                Jaisalmer • Hindi default • PWA ready
              </p>
              <h1 className="display-type mt-3 text-4xl text-[var(--accent-strong)] sm:text-5xl">
                PANWAR SMARTCARE HUB
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[rgba(19,49,58,0.76)]">
                Dr. Satta Ram Panwar Clinic, Dhandev Dental Clinic aur Associated Pharmacy
                ke liye ek single live-ready appointment aur queue management website.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={buildClinicHref("/book", activeClinicId)}
                className="focus-ring rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                अपॉइंटमेंट बुक करें
              </Link>
              <Link
                href={buildClinicHref("/walkin", activeClinicId)}
                className="focus-ring rounded-full bg-[var(--warm)] px-5 py-3 font-semibold text-white transition hover:bg-[#8b4626]"
              >
                Walk-in Token लें
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="section-shell hero-glow grid gap-8 pb-14 pt-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-end">
          <div className="fade-up">
            <p className="label-pill bg-[rgba(15,107,99,0.1)] text-[var(--accent-strong)]">
              Active clinic: {activeClinic.shortName}
            </p>
            <h2 className="display-type mt-6 text-5xl leading-[1.05] text-[var(--accent-strong)] sm:text-6xl">
              Family healthcare hub for Jaisalmer
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[rgba(19,49,58,0.8)]">
              Patients ko अलग app install nahi karna padega. Sirf website kholkar booking,
              token, queue status aur staff-led live progress sab kuch ek hi flow mein mil
              jayega.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {features.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(255,255,255,0.7)] px-4 py-4 text-base leading-7 text-[rgba(19,49,58,0.78)]"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.8rem] border border-[rgba(15,107,99,0.14)] bg-[linear-gradient(90deg,rgba(15,107,99,0.08),rgba(235,193,125,0.12))] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                Trust Highlight
              </p>
              <p className="mt-3 text-lg leading-8 text-[rgba(19,49,58,0.8)]">
                फरवरी 2026 में Dr. Satta Ram Panwar ne Government Jawahar Hospital,
                Jaisalmer mein 60 वर्षीय महिला के पेट se 6 Kg tumor safely remove kiya. Ye
                achievement website par trust marker ke roop mein highlight ki gayi hai.
              </p>
            </div>
          </div>

          <div className="fade-up-delay surface-panel-strong rounded-[2.6rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
              Live Queue Snapshot
            </p>
            <div className="mt-5 rounded-[2rem] bg-[rgba(15,107,99,0.94)] p-5 text-white">
              <p className="text-sm uppercase tracking-[0.3em] text-[rgba(255,255,255,0.68)]">
                Current Token
              </p>
              <p className="display-type mt-3 text-6xl">
                {summary.current?.token ?? `${activeClinic.prefix}-000`}
              </p>
              <p className="mt-3 text-base text-[rgba(255,255,255,0.78)]">
                {summary.current?.name ?? "Queue abhi start hone wali hai"}
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
                  Next
                </p>
                <p className="mt-3 text-3xl font-semibold">{summary.next?.token ?? "--"}</p>
              </div>
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
                  Waiting
                </p>
                <p className="mt-3 text-3xl font-semibold">{summary.waiting.length}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.6rem] border border-[var(--line)] bg-white/70 p-4 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
              <p>
                Sync mode:{" "}
                <strong>
                  {isOnline ? (syncInFlight ? "Sync in progress" : "Live online") : "Offline cache"}
                </strong>
              </p>
              <p>
                Clinic: <strong>{activeClinic.title}</strong>
              </p>
              <p>TV screen aur patient status dono same queue state ko use karte hain.</p>
            </div>
          </div>
        </section>

        <section className="section-shell pb-8">
          <div className="surface-panel-strong rounded-[2.4rem] p-6 sm:p-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                  Choose Your Clinic
                </p>
                <h3 className="display-type mt-3 text-4xl text-[var(--accent-strong)]">
                  एक portal, तीन clinic journeys
                </h3>
              </div>
              <p className="max-w-2xl text-base leading-7 text-[rgba(19,49,58,0.74)]">
                Home se hi patient surgery, dental ya pharmacy flow choose kar sakta hai.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {CLINICS.map((clinic) => (
                <article
                  key={clinic.id}
                  className={`rounded-[2rem] border p-5 ${
                    clinic.id === activeClinicId
                      ? "border-[rgba(15,107,99,0.24)] bg-[rgba(15,107,99,0.08)]"
                      : "border-[var(--line)] bg-[rgba(255,255,255,0.72)]"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                    {clinic.shortName}
                  </p>
                  <h4 className="mt-3 text-2xl font-semibold text-[var(--accent-strong)]">
                    {clinic.title}
                  </h4>
                  <p className="mt-3 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
                    {clinic.subtitle}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
                    {clinic.hoursLabel}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={buildClinicHref("/book", clinic.id)}
                      className="focus-ring rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Book
                    </Link>
                    <Link
                      href={buildClinicHref("/walkin", clinic.id)}
                      className="focus-ring rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold"
                    >
                      Walk-in
                    </Link>
                    <Link
                      href={buildClinicHref("/status", clinic.id)}
                      className="focus-ring rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold"
                    >
                      Status
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="surface-panel rounded-[2.4rem] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
              Patient Journey
            </p>
            <h3 className="display-type mt-3 text-4xl text-[var(--accent-strong)]">
              Sab kuch website par hi
            </h3>
            <div className="mt-6 space-y-4">
              {workflow.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.7)] px-4 py-4 text-base leading-7 text-[rgba(19,49,58,0.78)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="surface-panel rounded-[2rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                Contact
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[rgba(19,49,58,0.78)]">
                <p>
                  Qtr No. 1, Behind Poonam Stadium, Officers Colony, Police Line, Near
                  Mahila Police Station, Kishan Ghat / Khejer Para, Jaisalmer - 345001
                </p>
                <p>Phone / WhatsApp: 96362 43621</p>
                <a
                  href="tel:+919636243621"
                  className="focus-ring inline-flex rounded-full bg-[var(--accent)] px-4 py-2 font-semibold text-white"
                >
                  Call Now
                </a>
              </div>
            </div>

            <div className="surface-panel rounded-[2rem] overflow-hidden">
              <iframe
                title="Panwar SmartCare Hub map"
                src="https://www.google.com/maps?q=Qtr%20No.%201%2C%20Behind%20Poonam%20Stadium%2C%20Officers%20Colony%2C%20Police%20Line%2C%20Jaisalmer%2C%20Rajasthan%20345001&output=embed"
                className="min-h-[280px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
