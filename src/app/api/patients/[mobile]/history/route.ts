import { jsonError } from "@/app/api/api-helpers";
import { getPatientHistory, getPatientVisitSummary } from "@/lib/firebase/patient-history";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mobile: string }> },
) {
  try {
    const { mobile } = await params;

    if (!mobile || mobile.replace(/\D/g, "").length < 10) {
      return Response.json({ message: "Valid mobile number required." }, { status: 400 });
    }

    const [history, summary] = await Promise.all([
      getPatientHistory(mobile),
      getPatientVisitSummary(mobile),
    ]);

    return Response.json({ history, summary });
  } catch (error) {
    return jsonError(error);
  }
}
