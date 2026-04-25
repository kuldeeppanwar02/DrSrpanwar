"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { getQueueSummary } from "@/features/clinic/services/queue-engine";

const quickActions = [
  {
    href: "/book",
    title: "अपॉइंटमेंट बुक करें",
    caption: "आज / कल चुनें, स्लॉट चुनें, नाम और मोबाइल डालें.",
  },
  {
    href: "/status",
    title: "मेरा टोकन देखें",
    caption: "मोबाइल नंबर से current position, patients ahead aur wait time देखें.",
  },
  {
    href: "/walkin",
    title: "Walk-in Token लें",
    caption: "QR scan ke baad direct token page. Token turant generate hoga.",
  },
];

const services = [
  "Advance Laparoscopic Surgery",
  "Gastro एवं पेट की सर्जरी",
  "Trauma & Emergency Surgery",
  "General Surgery",
  "Abdominal & Hernia Surgery",
];

const patientFlow = [
  "होम पेज पर 3 बड़े actions: booking, status aur walk-in.",
  "बुकिंग में आज/कल tab, बड़े colorful slots aur simple confirmation.",
  "Walk-in token QR scan ke baad fast entry aur screenshot-friendly token screen.",
  "मेरा टोकन पेज पर live progress, doctor current token aur estimated wait time.",
];

const pwaFeatures = [
  "Service worker se home, booking, token aur status pages cache honge.",
  "Offline hone par form local pending state mein save hoga aur internet aane par sync-ready रहेगा.",
  "Chrome/Safari users Add to Home Screen karke ise native app jaise खोल सकेंगे.",
  "Reception fallback ke liye manual register + printed token slips ka option clearly documented rahega.",
];

export default function Home() {
  const { state, isOnline, syncInFlight } = useClinic();
  const summary = useMemo(() => getQueueSummary(state), [state]);

  return (
    <div className="page-shell overflow-x-hidden">
      <header className="section-shell pt-5">
        <div className="surface-panel rounded-[2rem] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
                Hindi-first Clinic PWA Prototype
              </p>
              <h1 className="display-type mt-2 text-3xl text-[var(--accent-strong)]">
                डॉ. सत्ताराम पंवार
              </h1>
            </div>

            <nav className="flex flex-wrap gap-2 text-sm font-semibold text-[rgba(19,49,58,0.78)]">
              <Link
                href="/book"
                className="focus-ring rounded-full border border-[var(--line)] px-3 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              >
                Book
              </Link>
              <Link
                href="/walkin"
                className="focus-ring rounded-full border border-[var(--line)] px-3 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              >
                Walk-in
              </Link>
              <Link
                href="/status"
                className="focus-ring rounded-full border border-[var(--line)] px-3 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              >
                My Token
              </Link>
              <Link
                href="/staff"
                className="focus-ring rounded-full border border-[var(--line)] px-3 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              >
                Staff
              </Link>
              <a
                className="focus-ring rounded-full bg-[var(--accent)] px-4 py-2 text-white transition hover:bg-[var(--accent-strong)]"
                href="tel:+919636243621"
              >
                Call Clinic
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <section className="section-shell hero-glow grid gap-10 pb-14 pt-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:items-end lg:pb-20">
          <div className="fade-up">
            <p className="label-pill bg-[rgba(15,107,99,0.1)] text-[var(--accent-strong)]">
              जैसलमेर • Hindi default • PWA ready • Queue + TV demo
            </p>
            <h2 className="display-type balance-text mt-6 text-5xl leading-[1.06] text-[var(--accent-strong)] sm:text-6xl lg:text-7xl">
              डॉ. सत्ताराम पंवार
            </h2>
            <p className="mt-4 max-w-3xl text-xl font-semibold tracking-[0.08em] text-[rgba(19,49,58,0.72)] uppercase">
              Advance Laparoscopic | Gastro | Trauma Specialist Surgeon
            </p>
            <p className="balance-text mt-6 max-w-3xl text-lg leading-8 text-[rgba(19,49,58,0.8)]">
              Jaisalmer ke patients ke liye ek simple single website prototype jahan se
              appointment booking, walk-in token, live queue status aur staff dashboard ek
              hi jagah se operate ho sakta hai.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/book"
                className="focus-ring rounded-full bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white transition hover:bg-[var(--accent-strong)] active:scale-[0.98]"
              >
                अपॉइंटमेंट बुक करें
              </Link>
              <Link
                href="/walkin"
                className="focus-ring rounded-full bg-[var(--warm)] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#8b4626] active:scale-[0.98]"
              >
                Walk-in Token लें
              </Link>
              <Link
                href="/status"
                className="focus-ring rounded-full border border-[var(--line-strong)] px-6 py-3 text-base font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] active:scale-[0.98]"
              >
                मेरा टोकन देखें
              </Link>
            </div>

            <div className="mt-8 rounded-[1.8rem] border border-[rgba(15,107,99,0.14)] bg-[linear-gradient(90deg,rgba(15,107,99,0.08),rgba(235,193,125,0.12))] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                Clinical Trust Marker
              </p>
              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <p className="max-w-3xl text-lg leading-8 text-[rgba(19,49,58,0.8)]">
                  फरवरी 2026 में 60 वर्षीय महिला के पेट से 6 Kg ट्यूमर की सफल surgery,
                  jo Jaisalmer patients ke trust ko immediately strengthen karti hai.
                </p>
                <div className="rounded-full bg-[rgba(255,255,255,0.74)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]">
                  {isOnline
                    ? syncInFlight
                      ? "Data sync in progress"
                      : "Live queue ready"
                    : "Offline-safe shell active"}
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(255,255,255,0.56)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                  Timing
                </p>
                <p className="mt-2 text-lg font-semibold">सुबह 9 बजे - शाम 6 बजे</p>
              </div>
              <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(255,255,255,0.56)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                  Emergency
                </p>
                <p className="mt-2 text-lg font-semibold">24×7 contact support</p>
              </div>
              <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(255,255,255,0.56)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                  Highlight
                </p>
                <p className="mt-2 text-lg font-semibold">6 Kg Tumor Surgery • Feb 2026</p>
              </div>
            </div>
          </div>

          <div className="fade-up-delay surface-panel-strong grid-lines rounded-[2.7rem] p-5 sm:p-6">
            <div className="grid gap-6">
              <div className="grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[2rem] bg-[linear-gradient(180deg,#fff7ed_0%,#f2e7d8_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--warm)]">
                    Doctor Profile
                  </p>
                  <Image
                    src="/doctor-placeholder.svg"
                    alt="Doctor portrait placeholder"
                    width={620}
                    height={760}
                    className="mt-4 h-auto w-full rounded-[1.6rem] border border-[rgba(19,49,58,0.08)]"
                    priority
                  />
                  <p className="mt-4 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
                    White coat wali professional photo ke liye placeholder ready hai.
                    Final version mein actual clinic portrait yahan replace ho jayegi.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[2rem] bg-[rgba(15,107,99,0.96)] p-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[rgba(255,255,255,0.72)]">
                      Live Queue Snapshot
                    </p>
                    <p className="mt-3 text-sm text-[rgba(255,255,255,0.72)]">
                      Demo data jo `/staff`, `/status` aur `/live` screens mein sync hota hai.
                    </p>
                    <div className="mt-6 grid gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[rgba(255,255,255,0.58)]">
                          Current Token
                        </p>
                        <p className="display-type mt-2 text-5xl">
                          {summary.current?.token ?? "T-000"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-[1.4rem] bg-[rgba(255,255,255,0.12)] p-4">
                          <p className="text-[rgba(255,255,255,0.64)]">Next</p>
                          <p className="mt-1 text-2xl font-semibold">
                            {summary.next?.token ?? "A-000"}
                          </p>
                        </div>
                        <div className="rounded-[1.4rem] bg-[rgba(255,255,255,0.12)] p-4">
                          <p className="text-[rgba(255,255,255,0.64)]">Waiting</p>
                          <p className="mt-1 text-2xl font-semibold">
                            {summary.waiting.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
                      QR Flow
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <Image
                        src="/demo-qr.svg"
                        alt="QR placeholder"
                        width={120}
                        height={120}
                        className="rounded-[1.2rem] border border-[var(--line)] bg-white p-2"
                      />
                      <div>
                        <p className="text-lg font-semibold">Reception / poster / card QR</p>
                        <p className="mt-2 text-sm leading-7 text-[rgba(19,49,58,0.74)]">
                          Final QR ko `/walkin` route par point karna hai. Scan karte hi patient
                          direct token page par chala jayega.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                      Achievement
                    </p>
                    <p className="mt-3 text-lg font-semibold">
                      60 वर्षीय महिला ke पेट se 6 Kg tumor successfully remove
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                      Recognition
                    </p>
                    <p className="mt-3 text-lg font-semibold">
                      Independence Day par DM Jaisalmer award
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                      Reach
                    </p>
                    <p className="mt-3 text-lg font-semibold">
                      Border area tak ke patients ke liye surgical access
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell pb-8">
          <div className="surface-panel-strong rounded-[2.4rem] p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                  Quick Access
                </p>
                <h3 className="display-type mt-3 text-4xl text-[var(--accent-strong)]">
                  Patient ke liye sabse simple flow
                </h3>
              </div>
              <p className="max-w-2xl text-base leading-7 text-[rgba(19,49,58,0.76)]">
                Home page se booking, token aur queue status ko badi touch-friendly actions ke
                saath open kiya gaya hai.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {quickActions.map((action, index) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`focus-ring rounded-[2rem] border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(19,49,58,0.08)] ${
                    index === 2
                      ? "border-[rgba(182,93,54,0.18)] bg-[rgba(182,93,54,0.08)]"
                      : "border-[var(--line)] bg-[rgba(255,255,255,0.7)]"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                    Step 0{index + 1}
                  </p>
                  <h4 className="mt-4 text-2xl font-semibold">{action.title}</h4>
                  <p className="mt-3 text-base leading-7 text-[rgba(19,49,58,0.74)]">
                    {action.caption}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell grid gap-8 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="surface-panel rounded-[2.4rem] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
              About Doctor
            </p>
            <h3 className="display-type mt-3 text-4xl text-[var(--accent-strong)]">
              भरोसेमंद surgical care, modern technology ke saath
            </h3>
            <p className="mt-6 text-lg leading-9 text-[rgba(19,49,58,0.78)]">
              डॉ. सत्ताराम पंवार (MBBS, MS, ATLS) जैसलमेर के प्रमुख एडवांस
              लेप्रोस्कोपिक, गैस्ट्रो एवं ट्रॉमा स्पेशलिस्ट सर्जन हैं। 10+ वर्षों के
              अनुभव के साथ वे लेप्रोस्कोपिक सर्जरी, गैस्ट्रोइंटेस्टाइनल सर्जरी और
              ट्रॉमा के गंभीर मामलों का सफल इलाज करते हैं। फरवरी 2026 में उन्होंने
              Government Jawahar Hospital, Jaisalmer में 60 वर्षीय महिला के पेट से 6
              किलो का ट्यूमर सफलतापूर्वक निकालकर जिले में नई मिसाल कायम की। उन्हें
              स्वतंत्रता दिवस पर DM Jaisalmer द्वारा उत्कृष्ट कार्य के लिए सम्मानित
              भी किया गया। उनका उद्देश्य है कि जैसलमेर और आसपास के हर मरीज को modern,
              reliable aur affordable surgical सुविधा आसानी से मिले।
            </p>
          </div>

          <div className="space-y-4">
            <div className="surface-panel rounded-[2rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                Specialties
              </p>
              <div className="mt-4 space-y-3">
                {services.map((service) => (
                  <div
                    key={service}
                    className="rounded-[1.3rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-base font-semibold"
                  >
                    {service}
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-panel rounded-[2rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                Contact
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[rgba(19,49,58,0.78)]">
                <p>
                  Qtr No. 1, Behind Poonam Stadium, Officers Colony, Police Line, Near
                  Mahila Police Station, Kishan Ghat / Khejer Para, Jaisalmer, Rajasthan -
                  345001
                </p>
                <p>फोन / WhatsApp: 96362 43621</p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href="tel:+919636243621"
                    className="focus-ring rounded-full bg-[var(--accent)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                  >
                    Call Now
                  </a>
                  <a
                    href="https://wa.me/919636243621"
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring rounded-full border border-[var(--line-strong)] px-4 py-2 font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell py-8">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="surface-panel rounded-[2.4rem] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                Patient Flow
              </p>
              <h3 className="display-type mt-3 text-4xl text-[var(--accent-strong)]">
                Website par hi पूरा clinic journey
              </h3>
              <div className="mt-6 space-y-4">
                {patientFlow.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] px-4 py-4 text-base leading-7 text-[rgba(19,49,58,0.76)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-panel rounded-[2.4rem] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                PWA + Offline
              </p>
              <h3 className="display-type mt-3 text-4xl text-[var(--accent-strong)]">
                Jaisalmer ke weak internet scenario ko dhyan mein rakhkar
              </h3>
              <div className="mt-6 space-y-4">
                {pwaFeatures.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] px-4 py-4 text-base leading-7 text-[rgba(19,49,58,0.76)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell grid gap-8 py-8 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
          <div className="surface-panel rounded-[2.4rem] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
              TV + Staff
            </p>
            <h3 className="display-type mt-3 text-4xl text-[var(--accent-strong)]">
              Ek merged dashboard, ek live waiting screen
            </h3>
            <div className="mt-6 space-y-4 text-base leading-8 text-[rgba(19,49,58,0.78)]">
              <p>
                Staff dashboard mein aaj ke bookings aur walk-ins ek hi merged queue mein
                दिखते हैं. Bada `Next` button current token ko update karta hai aur `/live`
                screen ko sync-friendly demo state se refresh karta hai.
              </p>
              <p>
                Manual actions jaise skip, hold aur reschedule bhi शामिल हैं. Full-screen TV
                page waiting area mein Chrome fullscreen ke saath chal sakta hai.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/staff"
                  className="focus-ring rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                >
                  Staff Dashboard
                </Link>
                <Link
                  href="/live"
                  className="focus-ring rounded-full border border-[var(--line-strong)] px-5 py-3 font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                >
                  Live TV Screen
                </Link>
              </div>
            </div>
          </div>

          <div className="surface-panel rounded-[2.4rem] overflow-hidden">
            <iframe
              title="Dr. Satta Ram Panwar clinic map"
              src="https://www.google.com/maps?q=Qtr%20No.%201%2C%20Behind%20Poonam%20Stadium%2C%20Officers%20Colony%2C%20Police%20Line%2C%20Jaisalmer%2C%20Rajasthan%20345001&output=embed"
              className="min-h-[420px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
