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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId") || "surgery";
    const weekStart = searchParams.get("weekStart") || getMonday();

    if (!isClinicId(clinicId)) {
      return Response.json({ message: "Invalid clinic." }, { status: 400 });
    }

    const schedule = await getWeekSchedule(clinicId as ClinicId, weekStart);

    // Convert the Record<string, DaySchedule> to an array format for the frontend
    const daysArray = DAY_NAMES.map((name, index) => ({
      dayOfWeek: index,
      ...(schedule.days[name] || {
        isOpen: index > 0 && index < 7,
        openTime: "09:00",
        closeTime: "17:00",
        slots: ["09:00 AM", "10:00 AM", "11:00 AM"],
        maxPatients: 30,
        notes: "",
      }),
    }));

    return Response.json({
      schedule: {
        ...schedule,
        days: daysArray,
      },
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
