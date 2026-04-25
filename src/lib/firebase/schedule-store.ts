import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import type { ClinicId } from "@/features/clinic/types";

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

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
    // Return default schedule
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
