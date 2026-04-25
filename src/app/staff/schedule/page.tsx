"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildClinicHref } from "@/features/clinic/catalog";
import { useClinic } from "@/features/clinic/state/clinic-provider";
import { useLang } from "@/i18n/lang-provider";
import { getStaffSession } from "@/components/navbar";

type DaySchedule = {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slots: string[];
  maxPatients: number;
  notes: string;
};

type WeekSchedule = {
  clinicId: string;
  weekStart: string;
  days: DaySchedule[];
  updatedAt?: string;
  updatedBy?: string;
};

const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function getMonday(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff + offsetWeeks * 7));
  return monday.toISOString().slice(0, 10);
}

function createDefaultDays(): DaySchedule[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    isOpen: i > 0 && i < 7,
    openTime: "09:00",
    closeTime: "17:00",
    slots: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "03:00 PM", "04:00 PM"],
    maxPatients: 30,
    notes: "",
  }));
}

export default function SchedulePage() {
  const { activeClinicId } = useClinic();
  const { t } = useLang();
  const session = typeof window !== "undefined" ? getStaffSession() : null;

  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = getMonday(weekOffset);
  const [days, setDays] = useState<DaySchedule[]>(createDefaultDays());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      setSaved(false);
      try {
        const res = await fetch(
          `/api/schedule?clinicId=${activeClinicId}&weekStart=${weekStart}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.schedule?.days?.length) {
            setDays(data.schedule.days);
          } else {
            setDays(createDefaultDays());
          }
        } else {
          setDays(createDefaultDays());
        }
      } catch {
        setDays(createDefaultDays());
      } finally {
        setLoading(false);
      }
    };
    void fetchSchedule();
  }, [activeClinicId, weekStart]);

  const updateDay = (index: number, changes: Partial<DaySchedule>) => {
    setDays((prev) =>
      prev.map((day, i) => (i === index ? { ...day, ...changes } : day)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: activeClinicId,
          weekStart,
          days,
          updatedBy: session?.name || "staff",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Save failed.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Auth guard
  if (!session) {
    return (
      <div className="page-shell">
        <div className="section-shell flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-[rgba(19,49,58,0.7)]">{t("staffMgmt", "notLoggedIn")}</p>
            <Link
              href={buildClinicHref("/staff", activeClinicId)}
              className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white"
            >
              {t("nav", "login")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="section-shell py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="display-type text-xl text-[var(--accent-strong)]">
            {t("schedule", "title")}
          </h1>
          <Link
            href={buildClinicHref("/staff", activeClinicId)}
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold"
          >
            ← {t("common", "back")}
          </Link>
        </div>

        {/* Week Navigation */}
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold"
          >
            {t("schedule", "prevWeek")}
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-[var(--accent-strong)]">
              {t("schedule", "weekOf")} {weekStart}
            </p>
            {weekOffset === 0 && (
              <p className="text-xs text-[rgba(19,49,58,0.5)]">{t("schedule", "thisWeek")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold"
          >
            {t("schedule", "nextWeek")}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-[rgba(182,93,54,0.08)] px-3 py-2 text-sm text-[#8b4626]">{error}</div>
        )}
        {saved && (
          <div className="mt-4 rounded-lg bg-[rgba(15,107,99,0.08)] px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]">
            ✓ {t("common", "saved")}
          </div>
        )}

        {/* Schedule Grid */}
        {loading ? (
          <p className="mt-6 text-sm text-[rgba(19,49,58,0.5)]">{t("common", "loading")}</p>
        ) : (
          <div className="mt-6 space-y-3">
            {days.map((day, index) => (
              <div
                key={index}
                className={`rounded-xl border p-4 transition ${
                  day.isOpen
                    ? "border-[var(--line)] bg-white/70"
                    : "border-[rgba(19,49,58,0.06)] bg-[rgba(19,49,58,0.02)] opacity-60"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateDay(index, { isOpen: !day.isOpen })}
                      className={`h-5 w-9 rounded-full transition ${
                        day.isOpen ? "bg-[var(--accent)]" : "bg-[rgba(19,49,58,0.15)]"
                      }`}
                    >
                      <span
                        className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          day.isOpen ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <span className="font-semibold">
                      {t("schedule", dayKeys[day.dayOfWeek])}
                    </span>
                    <span className="text-xs text-[rgba(19,49,58,0.5)]">
                      {day.isOpen ? t("schedule", "open") : t("schedule", "closed")}
                    </span>
                  </div>
                </div>

                {day.isOpen && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold uppercase text-[rgba(19,49,58,0.5)]">
                        {t("schedule", "openTime")}
                      </span>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => updateDay(index, { openTime: e.target.value })}
                        className="focus-ring w-full rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold uppercase text-[rgba(19,49,58,0.5)]">
                        {t("schedule", "closeTime")}
                      </span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => updateDay(index, { closeTime: e.target.value })}
                        className="focus-ring w-full rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold uppercase text-[rgba(19,49,58,0.5)]">
                        {t("schedule", "maxPatients")}
                      </span>
                      <input
                        type="number"
                        value={day.maxPatients}
                        onChange={(e) =>
                          updateDay(index, { maxPatients: Number(e.target.value) || 0 })
                        }
                        className="focus-ring w-full rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold uppercase text-[rgba(19,49,58,0.5)]">
                        {t("schedule", "slots")} <span className="normal-case text-[rgba(19,49,58,0.35)]">({t("schedule", "slotsHelp")})</span>
                      </span>
                      <input
                        value={day.slots.join(", ")}
                        onChange={(e) =>
                          updateDay(index, {
                            slots: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="focus-ring w-full rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 text-sm outline-none"
                        placeholder="09:00 AM, 10:00 AM"
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Save */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="focus-ring rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
          >
            {saving ? t("common", "saving") : t("schedule", "saveSchedule")}
          </button>
        </div>
      </div>
    </div>
  );
}
