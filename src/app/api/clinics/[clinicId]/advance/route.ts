import { readClinicId, jsonError } from "@/app/api/api-helpers";
import { advanceRemoteQueue } from "@/lib/firebase/queue-store";
import { requireStaffUser } from "@/lib/firebase/staff-auth";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ clinicId: string }> },
) {
  try {
    await requireStaffUser(request);
    const clinicId = await readClinicId(context.params);
    const state = await advanceRemoteQueue(clinicId);

    return Response.json({ state });
  } catch (error) {
    return jsonError(error);
  }
}
