import { jsonError } from "@/app/api/api-helpers";
import { verifyPin } from "@/lib/firebase/pin-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: string };
    const pin = body.pin?.trim();

    if (!pin) {
      return Response.json(
        { message: "PIN is required." },
        { status: 400 },
      );
    }

    const result = await verifyPin(pin);

    if (!result) {
      return Response.json(
        { message: "Invalid PIN. Please try again." },
        { status: 401 },
      );
    }

    return Response.json({
      success: true,
      member: {
        id: result.member.id,
        name: result.member.name,
        role: result.member.role,
        designation: result.member.designation,
        clinicAccess: result.member.clinicAccess,
        status: result.member.status,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
