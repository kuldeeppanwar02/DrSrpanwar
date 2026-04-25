import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { PrescriptionDoc } from "@/lib/firebase/prescription-store";

// GET single prescription with full photo data
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const doc = await db.collection("prescriptions").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = doc.data() as Omit<PrescriptionDoc, "id">;
    return NextResponse.json({ prescription: { id: doc.id, ...data } });
  } catch (error) {
    console.error("[GET /api/prescriptions/:id]", error);
    return NextResponse.json(
      { error: "Failed to fetch prescription" },
      { status: 500 },
    );
  }
}
