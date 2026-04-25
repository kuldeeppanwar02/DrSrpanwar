import { jsonError } from "@/app/api/api-helpers";
import { listStaffMembers, createStaffMember } from "@/lib/firebase/pin-auth";

export async function GET() {
  try {
    const members = await listStaffMembers();
    return Response.json({ members });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, pin, phone, email, designation, clinicAccess, status, createdBy } = body;

    if (!name?.trim()) {
      return Response.json({ message: "Name is required." }, { status: 400 });
    }
    if (!pin?.trim()) {
      return Response.json({ message: "PIN is required." }, { status: 400 });
    }

    const member = await createStaffMember({
      name: name.trim(),
      role: role || "staff",
      pin: pin.trim(),
      phone: phone?.trim() || "",
      email: email?.trim() || "",
      designation: designation?.trim() || "",
      clinicAccess: clinicAccess || ["surgery"],
      status: status || "active",
      createdBy: createdBy || "doctor",
    });

    return Response.json({ member }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
