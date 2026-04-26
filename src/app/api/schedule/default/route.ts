import { jsonError } from "@/app/api/api-helpers";
import { isClinicId } from "@/features/clinic/catalog";
import type { ClinicId } from "@/features/clinic/types";
import {
  getDefaultSchedule,
  saveDefaultSchedule,
  createEmptyDefaultSchedule,
  type ShiftDefinition,
} from "@/lib/firebase/schedule-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinic") || "surgery";

    if (!isClinicId(clinicId)) {
      return Response.json({ message: "Invalid clinic." }, { status: 400 });
    }

    const schedule = await getDefaultSchedule(clinicId as ClinicId);

    if (!schedule) {
      // Return empty default template
      return Response.json({
        exists: false,
        schedule: createEmptyDefaultSchedule(),
      });
    }

    return Response.json({
      exists: true,
      schedule,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clinicId, shifts, weeklyOff, slotInterval, maxPatients, updatedBy } = body;

    if (!isClinicId(clinicId)) {
      return Response.json({ message: "Invalid clinic." }, { status: 400 });
    }

    // Validate shifts
    if (!Array.isArray(shifts) || shifts.length !== 3) {
      return Response.json({ message: "Exactly 3 shifts required." }, { status: 400 });
    }

    for (const shift of shifts as ShiftDefinition[]) {
      if (shift.enabled && (!shift.startTime || !shift.endTime)) {
        return Response.json({ message: "Enabled shifts must have start and end times." }, { status: 400 });
      }
    }

    const saved = await saveDefaultSchedule(clinicId as ClinicId, {
      shifts: shifts as [ShiftDefinition, ShiftDefinition, ShiftDefinition],
      weeklyOff: weeklyOff || ["Sunday"],
      slotInterval: slotInterval || 30,
      maxPatients: maxPatients || 20,
      updatedBy: updatedBy || "staff",
    });

    return Response.json({ schedule: saved });
  } catch (error) {
    return jsonError(error);
  }
}
