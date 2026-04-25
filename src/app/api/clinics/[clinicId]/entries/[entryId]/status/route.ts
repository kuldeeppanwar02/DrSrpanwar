import {
  readClinicEntryParams,
  readQueueStatus,
  ApiRouteError,
  jsonError,
} from "@/app/api/api-helpers";
import { updateRemoteQueueEntryStatus } from "@/lib/firebase/queue-store";
import { requireStaffUser } from "@/lib/firebase/staff-auth";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ clinicId: string; entryId: string }> },
) {
  try {
    await requireStaffUser(request);
    const { clinicId, entryId } = await readClinicEntryParams(context.params);
    const body = (await request.json()) as { status?: string };

    if (!body.status) {
      throw new ApiRouteError("Status is required.", 400);
    }

    const state = await updateRemoteQueueEntryStatus(
      clinicId,
      entryId,
      readQueueStatus(body.status),
    );

    return Response.json({ state });
  } catch (error) {
    return jsonError(error);
  }
}
