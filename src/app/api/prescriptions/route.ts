import { NextRequest, NextResponse } from "next/server";
import {
  createPrescription,
  getPrescriptionsForDate,
  updatePrescriptionStatus,
} from "@/lib/firebase/prescription-store";
import type { PrescriptionStatus } from "@/lib/firebase/prescription-store";

// POST — create prescription with photos
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clinicId, tokenId, patientName, photos, createdBy } = body;

    if (!clinicId || !tokenId || !patientName || !photos?.length) {
      return NextResponse.json(
        { error: "clinicId, tokenId, patientName, and photos are required" },
        { status: 400 },
      );
    }

    // Limit photo size (each base64 should be < 5MB)
    for (const photo of photos) {
      if (typeof photo === "string" && photo.length > 7 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Each photo must be under 5MB" },
          { status: 400 },
        );
      }
    }

    const prescription = await createPrescription({
      clinicId,
      tokenId,
      patientName,
      photos,
      createdBy: createdBy || "staff",
    });

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/prescriptions]", error);
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 },
    );
  }
}

// GET — list prescriptions for date + clinic
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get("clinic") || undefined;
    const date = searchParams.get("date") || undefined;

    const prescriptions = await getPrescriptionsForDate(clinicId, date);

    // Don't send full base64 in list view — send metadata only
    const light = prescriptions.map((p) => ({
      ...p,
      photoCount: p.photoUrls.length,
      photoUrls: [], // strip photos from list for performance
    }));

    return NextResponse.json({ prescriptions: light });
  } catch (error) {
    console.error("[GET /api/prescriptions]", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 },
    );
  }
}

// PATCH — update prescription status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { prescriptionId, status } = body;

    if (!prescriptionId || !status) {
      return NextResponse.json(
        { error: "prescriptionId and status are required" },
        { status: 400 },
      );
    }

    const validStatuses: PrescriptionStatus[] = ["sent", "preparing", "ready"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "status must be sent, preparing, or ready" },
        { status: 400 },
      );
    }

    await updatePrescriptionStatus(prescriptionId, status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PATCH /api/prescriptions]", error);
    return NextResponse.json(
      { error: "Failed to update prescription" },
      { status: 500 },
    );
  }
}
