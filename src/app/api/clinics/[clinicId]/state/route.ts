import { readClinicId, jsonError } from "@/app/api/api-helpers";
import { getRemoteClinicState } from "@/lib/firebase/queue-store";

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
