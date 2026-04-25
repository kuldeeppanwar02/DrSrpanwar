import { jsonError } from "@/app/api/api-helpers";
import { updateStaffMember, deleteStaffMember } from "@/lib/firebase/pin-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ staffId: string }> },
) {
  try {
    const { staffId } = await params;
    const body = await request.json();

    if (!staffId) {
      return Response.json({ message: "Staff ID is required." }, { status: 400 });
    }

    await updateStaffMember(staffId, {
      name: body.name,
      phone: body.phone,
      email: body.email,
      designation: body.designation,
      clinicAccess: body.clinicAccess,
      status: body.status,
      role: body.role,
      pin: body.pin,
    });

    return Response.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ staffId: string }> },
) {
  try {
    const { staffId } = await params;

    if (!staffId) {
      return Response.json({ message: "Staff ID is required." }, { status: 400 });
    }

    await deleteStaffMember(staffId);
    return Response.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
