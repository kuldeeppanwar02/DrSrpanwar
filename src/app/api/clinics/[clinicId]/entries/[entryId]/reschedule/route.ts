import { readClinicEntryParams, jsonError } from "@/app/api/api-helpers";
import { rescheduleRemoteQueueEntry } from "@/lib/firebase/queue-store";
import { requireStaffUser } from "@/lib/firebase/staff-auth";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ clinicId: string; entryId: string }> },
) {
  try {
    await requireStaffUser(request);
    const { clinicId, entryId } = await readClinicEntryParams(context.params);
    const state = await rescheduleRemoteQueueEntry(clinicId, entryId);

    return Response.json({ state });
  } catch (error) {
    return jsonError(error);
  }
}
