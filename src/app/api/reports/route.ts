import { jsonError } from "@/app/api/api-helpers";
import { getClinicVisitsByDateRange } from "@/lib/firebase/patient-history";
import { requireStaffUser } from "@/lib/firebase/staff-auth";
import type { ClinicId } from "@/features/clinic/types";

export async function GET(request: Request) {
  try {
    await requireStaffUser(request, { allowRoles: ["doctor", "staff"] });
    
    const url = new URL(request.url);
    const clinicId = url.searchParams.get("clinicId") as ClinicId;
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (!clinicId || !startDate || !endDate) {
      return Response.json({ message: "clinicId, startDate, and endDate are required." }, { status: 400 });
    }

    const visits = await getClinicVisitsByDateRange(clinicId, startDate, endDate);
    return Response.json({ visits });
  } catch (error) {
    return jsonError(error);
  }
}
