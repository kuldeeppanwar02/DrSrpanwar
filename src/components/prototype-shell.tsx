import Link from "next/link";

type PrototypeShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
};

const navItems = [
  { href: "/", label: "होम" },
  { href: "/book", label: "बुकिंग" },
  { href: "/walkin", label: "Walk-in" },
  { href: "/status", label: "मेरा टोकन" },
  { href: "/staff", label: "स्टाफ" },
  { href: "/live", label: "TV Screen" },
];

export function PrototypeShell({
  eyebrow,
  title,
  description,
  children,
  aside,
}: PrototypeShellProps) {
  return (
    <div className="page-shell">
      <header className="section-shell pt-6">
        <div className="surface-panel rounded-[2rem] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/" className="display-type text-2xl text-[var(--accent-strong)]">
                डॉ. सत्ताराम पंवार
              </Link>
              <p className="mt-1 text-sm text-[rgba(19,49,58,0.68)]">
                Advance Laparoscopic, Gastro & Trauma Specialist Surgeon
              </p>
            </div>
            <nav className="flex flex-wrap gap-2 text-sm font-semibold text-[rgba(19,49,58,0.76)]">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="focus-ring rounded-full border border-[var(--line)] px-3 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="section-shell py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <section className="surface-panel-strong rounded-[2.4rem] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
              {eyebrow}
            </p>
            <h1 className="display-type balance-text mt-4 text-4xl leading-tight text-[var(--accent-strong)] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[rgba(19,49,58,0.76)]">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </section>

          <aside className="space-y-4">
            <div className="surface-panel rounded-[2rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                Clinic Details
              </p>
              <div className="mt-4 space-y-4 text-sm leading-7 text-[rgba(19,49,58,0.78)]">
                <p>
                  Qtr No. 1, Behind Poonam Stadium, Officers Colony, Police Line,
                  Near Mahila Police Station, Jaisalmer, Rajasthan - 345001
                </p>
                <p>सुबह 9:00 बजे से शाम 6:00 बजे तक</p>
                <p>इमरजेंसी के लिए 24×7 संपर्क: 96362 43621</p>
              </div>
            </div>
            {aside}
            <div className="surface-panel rounded-[2rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                Prototype Note
              </p>
              <p className="mt-3 text-sm leading-7 text-[rgba(19,49,58,0.76)]">
                Yeh version local demo state use karta hai. Production mein Firebase,
                login roles aur real QR final URL ke saath connect kiya jayega.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
