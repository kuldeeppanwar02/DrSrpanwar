import { jsonError } from "@/app/api/api-helpers";
import { isClinicId } from "@/features/clinic/catalog";
import type { ClinicId } from "@/features/clinic/types";
import {
  getWeekSchedule,
  saveWeekSchedule,
  getMonday,
  type DaySchedule,
} from "@/lib/firebase/schedule-store";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Generate 30-min interval slot labels from HH:mm open to HH:mm close */
function generateSlots(open: string, close: string): string[] {
  const slots: string[] = [];
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  let mins = oh * 60 + om;
  const endMins = ch * 60 + cm;
  while (mins < endMins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    slots.push(`${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`);
    mins += 30;
  }
  return slots;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinic") || searchParams.get("clinicId") || "surgery";
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0", 10);

    if (!isClinicId(clinicId)) {
      return Response.json({ message: "Invalid clinic." }, { status: 400 });
    }

    // Calculate weekStart based on offset
    const monday = new Date();
    const dayOfWeek = monday.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(monday.getDate() + diff + weekOffset * 7);
    const weekStart = searchParams.get("weekStart") || monday.toISOString().split("T")[0];

    const schedule = await getWeekSchedule(clinicId as ClinicId, weekStart);

    const defaultOpen = "09:00";
    const defaultClose = "17:00";

    // Convert the Record<string, DaySchedule> to an array format for the frontend
    const daysArray = DAY_NAMES.map((name, index) => {
      const saved = schedule.days[name];
      if (saved) {
        // If saved day has open/close times but empty slots, auto-generate
        return {
          dayOfWeek: index,
          dayName: name,
          ...saved,
          slots: saved.isOpen && saved.openTime && saved.closeTime && (!saved.slots || saved.slots.length === 0)
            ? generateSlots(saved.openTime, saved.closeTime)
            : saved.slots || [],
        };
      }
      // Fallback for unconfigured days
      const isOpen = index > 0 && index < 7;
      return {
        dayOfWeek: index,
        dayName: name,
        isOpen,
        openTime: defaultOpen,
        closeTime: defaultClose,
        slots: isOpen ? generateSlots(defaultOpen, defaultClose) : [],
        maxPatients: 30,
        notes: "",
      };
    });

    return Response.json({
      schedule: daysArray,
      weekStart,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clinicId, weekStart, days, updatedBy } = body;

    if (!isClinicId(clinicId)) {
      return Response.json({ message: "Invalid clinic." }, { status: 400 });
    }
    if (!weekStart || !days) {
      return Response.json({ message: "weekStart and days are required." }, { status: 400 });
    }

    // Convert array format back to Record<string, DaySchedule> for the store
    const daysRecord: Record<string, DaySchedule> = {};
    (days as Array<{ dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string; slots: string[]; maxPatients: number; notes: string }>).forEach(
      (day) => {
        const name = DAY_NAMES[day.dayOfWeek];
        if (name) {
          daysRecord[name] = {
            isOpen: day.isOpen,
            openTime: day.openTime,
            closeTime: day.closeTime,
            slots: day.slots,
            maxPatients: day.maxPatients,
            notes: day.notes || "",
          };
        }
      },
    );

    const schedule = await saveWeekSchedule(
      clinicId as ClinicId,
      weekStart,
      daysRecord,
      updatedBy || "staff",
    );

    return Response.json({ schedule });
  } catch (error) {
    return jsonError(error);
  }
}
