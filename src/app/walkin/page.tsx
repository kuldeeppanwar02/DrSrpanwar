"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { buildClinicHref } from "@/features/clinic/catalog";
import { getEntryPosition, getQueueSummary } from "@/features/clinic/services/queue-engine";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";

type WalkInConfirmation = {
  token: string;
  bookingId: string;
  waitMinutes: number;
  syncState: "synced" | "pending";
};

export default function WalkInPage() {
  const { activeClinic, activeClinicId, createWalkIn, isOnline, syncInFlight } = useClinic();
  const { t } = useLang();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [requiresPharmacyFollowUp, setRequiresPharmacyFollowUp] = useState(activeClinicId === "pharmacy");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<WalkInConfirmation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() && mobile.replace(/\D/g, "").length === 0) {
      setError(t("walkin", "nameOrMobileRequired"));
      return;
    }
    if (mobile && mobile.replace(/\D/g, "").length > 0 && mobile.replace(/\D/g, "").length !== 10) {
      setError(t("booking", "invalidMobile"));
      return;
    }
    setIsSubmitting(true);
    try {
      const nextState = await createWalkIn({
        clinicId: activeClinicId,
        name,
        mobile,
        requiresPharmacyFollowUp,
      });
      const latestEntry = nextState.queue[nextState.queue.length - 1];
      const position = getEntryPosition(nextState, latestEntry.id);
      const summary = getQueueSummary(nextState);
      setConfirmation({
        token: latestEntry.token,
        bookingId: latestEntry.bookingId,
        waitMinutes: Math.max(position?.estimatedWaitMinutes ?? 0, summary.current ? 10 : 0),
        syncState: latestEntry.syncState,
      });
      setError("");
      setName("");
      setMobile("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Token generation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="section-shell py-8">
        <div className="mx-auto max-w-lg">
          <h1 className="display-type text-center text-2xl text-[var(--accent-strong)] sm:text-3xl">
            {t("walkin", "title")} — {activeClinic.shortName}
          </h1>
          <p className="mt-2 text-center text-sm text-[rgba(19,49,58,0.65)]">
            {t("walkin", "subtitle")}
          </p>

          <div className="mt-8 grid gap-6">
            {/* Form */}
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-5">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-[rgba(19,49,58,0.7)]">
                      {t("walkin", "patientName")}
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="focus-ring w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none"
                      placeholder={t("booking", "namePlaceholder")}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-[rgba(19,49,58,0.7)]">
                      {t("common", "mobile")}
                    </span>
                    <input
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      inputMode="numeric"
                      className="focus-ring w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none"
                      placeholder={t("booking", "mobilePlaceholder")}
                    />
                  </label>
                </div>

                {activeClinicId !== "pharmacy" && (
                  <label className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white/60 px-3 py-2.5 text-sm text-[rgba(19,49,58,0.7)]">
                    <input
                      type="checkbox"
                      checked={requiresPharmacyFollowUp}
                      onChange={(e) => setRequiresPharmacyFollowUp(e.target.checked)}
                      className="h-4 w-4"
                    />
                    {t("walkin", "pharmacyFollowUp")}
                  </label>
                )}

                {error && (
                  <p className="rounded-lg bg-[rgba(182,93,54,0.1)] px-3 py-2 text-sm font-semibold text-[#8b4626]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="focus-ring w-full rounded-full bg-[var(--warm)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8b4626] disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("walkin", "generating") : t("walkin", "generateBtn")}
                </button>
                <p className="text-center text-xs text-[rgba(19,49,58,0.55)]">
                  {isOnline ? t("walkin", "onlineMode") : t("walkin", "offlineMode")}
                </p>
              </form>
            </div>

            {/* Token Result */}
            {confirmation ? (
              <div className="fade-up rounded-2xl bg-[rgba(19,49,58,0.94)] p-6 text-center text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,255,255,0.6)]">
                  {t("walkin", "yourToken")}
                </p>
                <p className="display-type mt-3 text-6xl">{confirmation.token}</p>
                <div className="mt-4 space-y-1 text-sm text-[rgba(255,255,255,0.7)]">
                  <p>{t("walkin", "referenceId")}: <strong>{confirmation.bookingId}</strong></p>
                  <p>{t("walkin", "estimatedWait")}: <strong>{confirmation.waitMinutes} {t("booking", "minutes")}</strong></p>
                  <p className="text-xs">
                    {confirmation.syncState === "pending" ? t("booking", "pending") : t("booking", "synced")}
                  </p>
                </div>
                {syncInFlight && (
                  <p className="mt-2 text-xs font-semibold text-[rgba(255,255,255,0.8)]">{t("home", "syncing")}...</p>
                )}
                <p className="mt-4 rounded-lg bg-[rgba(235,193,125,0.15)] px-3 py-2 text-xs font-semibold">
                  {t("walkin", "noteToken")}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `🏥 मेरा वॉक-इन टोकन!\n\n📋 टोकन: ${confirmation.token}\n🏥 क्लिनिक: ${activeClinic.shortName}\n⏱️ Wait: ~${confirmation.waitMinutes} min\n\nPanwar SmartCare Hub`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
                  >
                    {t("whatsapp", "shareBtn")}
                  </a>
                  <Link
                    href={buildClinicHref("/status", activeClinicId)}
                    className="rounded-full border border-[rgba(255,255,255,0.2)] px-4 py-2 text-sm font-semibold"
                  >
                    {t("walkin", "checkQueue")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-white/40 p-5 text-center text-sm text-[rgba(19,49,58,0.55)]">
                {t("walkin", "yourToken")} — {t("common", "loading").replace("...", "")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
