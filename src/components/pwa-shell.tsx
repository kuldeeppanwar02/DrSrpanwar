"use client";

import { useEffect, useState } from "react";
import { useClinic } from "@/features/clinic/state/clinic-provider";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export function PwaShell() {
  const { isOnline, syncInFlight } = useClinic();
  const [isStandalone, setIsStandalone] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const displayMode = window.matchMedia("(display-mode: standalone)");

    const updateMode = () => {
      const standaloneNavigator = window.navigator as Navigator & {
        standalone?: boolean;
      };

      setIsStandalone(displayMode.matches || standaloneNavigator.standalone === true);
    };

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    updateMode();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    displayMode.addEventListener("change", updateMode);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      displayMode.removeEventListener("change", updateMode);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <>
      {!isOnline ? (
        <div className="fixed left-1/2 top-4 z-50 w-[min(92vw,52rem)] -translate-x-1/2 rounded-full border border-[#b65d36]/25 bg-[#fff3ea]/95 px-4 py-3 text-sm text-[#7a3b20] shadow-[0_14px_40px_rgba(182,93,54,0.16)] backdrop-blur">
          इंटरनेट अभी उपलब्ध नहीं है. App shell aur recent queue data cache se dikh raha
          hai. Form submit karne par entry local pending state mein save hogi.
        </div>
      ) : null}

      {!isStandalone ? (
        <div className="fixed bottom-4 right-4 z-40 w-[min(92vw,26rem)] rounded-[1.6rem] border border-[var(--line)] bg-[rgba(255,248,238,0.96)] p-4 text-sm text-[var(--foreground)] shadow-[0_22px_70px_rgba(19,49,58,0.16)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            PWA Shortcut
          </p>
          <p className="mt-2 text-base font-semibold">
            Add to Home Screen karke isse app jaise khol sakte hain.
          </p>
          <p className="mt-2 text-sm leading-6 text-[rgba(19,49,58,0.76)]">
            Chrome ya Safari menu se shortcut add ho jayega. Internet aane par pending
            forms auto-sync ke liye ready rahenge.
          </p>
          {syncInFlight ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Syncing cached actions...
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            {installPrompt ? (
              <button
                className="focus-ring rounded-full bg-[var(--accent)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                onClick={installApp}
                type="button"
              >
                होम स्क्रीन पर जोड़ें
              </button>
            ) : (
              <span className="rounded-full bg-[rgba(15,107,99,0.1)] px-4 py-2 font-semibold text-[var(--accent-strong)]">
                Menu → Add to Home Screen
              </span>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
