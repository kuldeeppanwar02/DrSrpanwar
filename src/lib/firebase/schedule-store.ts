import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import type { ClinicId } from "@/features/clinic/types";

/* ═══════════════════════════════════════════════
   SHIFT-BASED TYPES (New — "Set Once" System)
   ═══════════════════════════════════════════════ */

export type ShiftDefinition = {
  label: string;      // e.g. "Morning", "Afternoon", "Evening"
  startTime: string;  // "08:00"
  endTime: string;    // "09:00"
  enabled: boolean;
};

export type DefaultSchedule = {
  clinicId: ClinicId;
  shifts: [ShiftDefinition, ShiftDefinition, ShiftDefinition];
  weeklyOff: string[];      // ["Sunday"]
  slotInterval: number;     // 30 minutes
  maxPatients: number;
  updatedAt: string;
  updatedBy: string;
};

export type DayOverride = {
  id: string;
  clinicId: ClinicId;
  date: string;             // "2026-04-26"
  closedShifts: number[];   // [2] = shift index 2 is closed
  fullDayClosed: boolean;
  reason: string;
  createdBy: string;
  createdAt: string;
};

/* ═══════════════════════════════════════════════
   LEGACY TYPES (Week-by-Week System — kept)
   ═══════════════════════════════════════════════ */

export type DaySchedule = {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slots: string[];
  maxPatients: number;
  notes: string;
};

export type WeekSchedule = {
  id: string;
  clinicId: ClinicId;
  weekStart: string;
  weekEnd: string;
  days: Record<string, DaySchedule>;
  updatedAt: string;
  updatedBy: string;
};

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_SHIFTS: [ShiftDefinition, ShiftDefinition, ShiftDefinition] = [
  { label: "Morning", startTime: "09:00", endTime: "12:00", enabled: true },
  { label: "Afternoon", startTime: "12:00", endTime: "15:00", enabled: true },
  { label: "Evening", startTime: "15:00", endTime: "18:00", enabled: false },
];

/* ═══════════════════════════════════════════════
   SLOT GENERATION
   ═══════════════════════════════════════════════ */

/** Generate time-slot labels from HH:mm to HH:mm at given interval */
export function generateSlots(start: string, end: string, interval = 30): string[] {
  if (!start || !end) return [];
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = sh * 60 + (sm || 0);
  const endMins = eh * 60 + (em || 0);

  while (mins < endMins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    slots.push(`${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`);
    mins += interval;
  }
  return slots;
}

/** Auto-detect shift label from time range */
export function autoShiftLabel(startTime: string): string {
  const h = parseInt(startTime.split(":")[0], 10);
  if (h < 8) return "Early Morning";
  if (h < 12) return "Morning";
  if (h < 15) return "Afternoon";
  if (h < 18) return "Evening";
  return "Night";
}

/* ═══════════════════════════════════════════════
   DEFAULT SCHEDULE CRUD
   ═══════════════════════════════════════════════ */

export async function getDefaultSchedule(
  clinicId: ClinicId,
): Promise<DefaultSchedule | null> {
  const db = getAdminDb();
  const doc = await db.collection("defaultSchedules").doc(clinicId).get();
  if (!doc.exists) return null;
  return doc.data() as DefaultSchedule;
}

export async function saveDefaultSchedule(
  clinicId: ClinicId,
  schedule: Omit<DefaultSchedule, "clinicId" | "updatedAt">,
): Promise<DefaultSchedule> {
  const db = getAdminDb();
  const now = new Date().toISOString();

  const data: DefaultSchedule = {
    ...schedule,
    clinicId,
    updatedAt: now,
  };

  await db.collection("defaultSchedules").doc(clinicId).set(data);
  return data;
}

export function createEmptyDefaultSchedule(): DefaultSchedule {
  return {
    clinicId: "surgery",
    shifts: [...DEFAULT_SHIFTS] as [ShiftDefinition, ShiftDefinition, ShiftDefinition],
    weeklyOff: ["Sunday"],
    slotInterval: 30,
    maxPatients: 20,
    updatedAt: "",
    updatedBy: "",
  };
}

/* ═══════════════════════════════════════════════
   DAY OVERRIDE CRUD
   ═══════════════════════════════════════════════ */

function overrideDocId(clinicId: ClinicId, date: string): string {
  return `${clinicId}_${date}`;
}

export async function getDayOverride(
  clinicId: ClinicId,
  date: string,
): Promise<DayOverride | null> {
  const db = getAdminDb();
  const doc = await db.collection("dayOverrides").doc(overrideDocId(clinicId, date)).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Omit<DayOverride, "id">) };
}

export async function saveDayOverride(
  clinicId: ClinicId,
  date: string,
  override: {
    closedShifts: number[];
    fullDayClosed: boolean;
    reason: string;
    createdBy: string;
  },
): Promise<DayOverride> {
  const db = getAdminDb();
  const docId = overrideDocId(clinicId, date);
  const now = new Date().toISOString();

  const data = {
    clinicId,
    date,
    ...override,
    createdAt: now,
  };

  await db.collection("dayOverrides").doc(docId).set(data);
  return { id: docId, ...data };
}

export async function deleteDayOverride(
  clinicId: ClinicId,
  date: string,
): Promise<void> {
  const db = getAdminDb();
  await db.collection("dayOverrides").doc(overrideDocId(clinicId, date)).delete();
}

/* ═══════════════════════════════════════════════
   MERGED SCHEDULE — Priority: Override > Week > Default
   ═══════════════════════════════════════════════ */

export type ResolvedDaySchedule = {
  dayName: string;
  dayOfWeek: number;
  isOpen: boolean;
  shifts: Array<ShiftDefinition & { slots: string[]; closed: boolean }>;
  allSlots: string[];  // flat list of all enabled shift slots
  maxPatients: number;
  source: "default" | "week" | "override";
  override?: DayOverride;
};

/**
 * Resolve schedule for a specific day by merging layers:
 * 1. Day Override (highest priority)
 * 2. Week-specific schedule
 * 3. Default schedule (lowest priority)
 */
export async function resolveScheduleForDate(
  clinicId: ClinicId,
  date: string,
): Promise<ResolvedDaySchedule> {
  const dateObj = new Date(date + "T00:00:00");
  const dayOfWeek = dateObj.getDay();
  const dayName = DAY_NAMES[dayOfWeek];

  // 1. Check day override
  const override = await getDayOverride(clinicId, date);

  // 2. Get default schedule
  const defaultSched = await getDefaultSchedule(clinicId);

  // 3. Check week-specific schedule
  const weekStart = getMonday(dateObj);
  const weekSched = await getWeekSchedule(clinicId, weekStart);
  const weekDay = weekSched.days[dayName];

  // --- Resolve ---

  // If no default schedule exists, use legacy week system
  if (!defaultSched) {
    const isOpen = weekDay ? weekDay.isOpen : dayOfWeek !== 0;
    const slots = weekDay && weekDay.isOpen
      ? (weekDay.slots?.length ? weekDay.slots : generateSlots(weekDay.openTime, weekDay.closeTime))
      : [];

    return {
      dayName,
      dayOfWeek,
      isOpen,
      shifts: [{
        label: "Full Day",
        startTime: weekDay?.openTime || "09:00",
        endTime: weekDay?.closeTime || "18:00",
        enabled: isOpen,
        slots,
        closed: !isOpen,
      }],
      allSlots: slots,
      maxPatients: weekDay?.maxPatients || 30,
      source: "week",
    };
  }

  // Default schedule exists — use shift-based logic
  const isWeeklyOff = defaultSched.weeklyOff.includes(dayName);
  const interval = defaultSched.slotInterval || 30;

  // Check if week-specific override exists (old system)
  const hasWeekOverride = weekDay && weekSched.updatedAt;

  // Build shifts with slots
  const resolvedShifts = defaultSched.shifts.map((shift, idx) => {
    const shiftEnabled = shift.enabled && !isWeeklyOff;
    const closedByOverride = override
      ? override.fullDayClosed || override.closedShifts.includes(idx)
      : false;

    // If week-specific data exists and no default, use week data for this day
    // Otherwise use default shifts
    const isOpen = shiftEnabled && !closedByOverride;
    const slots = isOpen ? generateSlots(shift.startTime, shift.endTime, interval) : [];

    return {
      ...shift,
      enabled: shiftEnabled,
      slots,
      closed: closedByOverride,
    };
  });

  // If using week override and no default shifts customized
  if (hasWeekOverride && weekDay) {
    // Week-specific schedule takes priority over default for this day
    const isOpenWeek = weekDay.isOpen && !override?.fullDayClosed;
    if (!isOpenWeek && !isWeeklyOff) {
      // Week says closed for this specific day
      return {
        dayName,
        dayOfWeek,
        isOpen: false,
        shifts: resolvedShifts.map(s => ({ ...s, slots: [], closed: true })),
        allSlots: [],
        maxPatients: defaultSched.maxPatients,
        source: "week",
        override: override || undefined,
      };
    }
  }

  const isOpen = !isWeeklyOff && !override?.fullDayClosed && resolvedShifts.some(s => s.slots.length > 0);
  const allSlots = resolvedShifts.flatMap(s => s.slots);

  return {
    dayName,
    dayOfWeek,
    isOpen,
    shifts: resolvedShifts,
    allSlots,
    maxPatients: defaultSched.maxPatients,
    source: override ? "override" : "default",
    override: override || undefined,
  };
}

/* ═══════════════════════════════════════════════
   LEGACY — Week Schedule CRUD (kept for compat)
   ═══════════════════════════════════════════════ */

function defaultDaySchedule(): DaySchedule {
  return {
    isOpen: true,
    openTime: "09:00",
    closeTime: "18:00",
    slots: ["09:30 AM", "10:00 AM", "10:30 AM", "11:15 AM", "12:00 PM", "04:30 PM"],
    maxPatients: 20,
    notes: "",
  };
}

function createDefaultWeek(): Record<string, DaySchedule> {
  const days: Record<string, DaySchedule> = {};
  for (const day of DAY_NAMES) {
    days[day] = defaultDaySchedule();
    if (day === "Sunday") {
      days[day].isOpen = false;
      days[day].notes = "Closed";
    }
  }
  return days;
}

function getWeekId(clinicId: ClinicId, weekStart: string): string {
  return `${clinicId}_${weekStart}`;
}

export async function getWeekSchedule(
  clinicId: ClinicId,
  weekStart: string,
): Promise<WeekSchedule> {
  const db = getAdminDb();
  const docId = getWeekId(clinicId, weekStart);
  const doc = await db.collection("schedules").doc(docId).get();

  if (!doc.exists) {
    const weekEnd = getWeekEnd(weekStart);
    return {
      id: docId,
      clinicId,
      weekStart,
      weekEnd,
      days: createDefaultWeek(),
      updatedAt: "",
      updatedBy: "",
    };
  }

  return { id: doc.id, ...(doc.data() as Omit<WeekSchedule, "id">) };
}

export async function saveWeekSchedule(
  clinicId: ClinicId,
  weekStart: string,
  days: Record<string, DaySchedule>,
  updatedBy: string,
): Promise<WeekSchedule> {
  const db = getAdminDb();
  const docId = getWeekId(clinicId, weekStart);
  const weekEnd = getWeekEnd(weekStart);
  const now = new Date().toISOString();

  const data = {
    clinicId,
    weekStart,
    weekEnd,
    days,
    updatedAt: now,
    updatedBy,
  };

  await db.collection("schedules").doc(docId).set(data, { merge: true });
  return { id: docId, ...data };
}

/* ═══════════════════════════════════════════════
   DATE HELPERS
   ═══════════════════════════════════════════════ */

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}

export function getMonday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export function getNextMonday(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

export function getPrevMonday(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

export function todayDateStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function tomorrowDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
