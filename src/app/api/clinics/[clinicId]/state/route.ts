import { readClinicId, jsonError } from "@/app/api/api-helpers";
import {
  getRemoteClinicState,
  setRemoteClinicEmergencyState,
} from "@/lib/firebase/queue-store";
import { requireStaffUser } from "@/lib/firebase/staff-auth";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ clinicId: string }> },
) {
  try {
    const clinicId = await readClinicId(context.params);
    const state = await getRemoteClinicState(clinicId);

    return Response.json({ state });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ clinicId: string }> },
) {
  try {
    const clinicId = await readClinicId(context.params);
    await requireStaffUser(request, {
      allowRoles: ["doctor"],
      clinicId,
    });

    const body = (await request.json()) as {
      emergencyClosed?: boolean;
      emergencyMessage?: string;
    };

    if (typeof body.emergencyClosed !== "boolean") {
      return Response.json({ message: "emergencyClosed is required." }, { status: 400 });
    }

    const state = await setRemoteClinicEmergencyState(clinicId, {
      emergencyClosed: body.emergencyClosed,
      emergencyMessage: body.emergencyMessage,
    });

    return Response.json({ state });
  } catch (error) {
    return jsonError(error);
  }
}
