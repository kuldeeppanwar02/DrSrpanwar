import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import type { ClinicId } from "@/features/clinic/types";

export type PrescriptionStatus = "sent" | "preparing" | "ready";

export type PrescriptionDoc = {
  id: string;
  clinicId: ClinicId;
  tokenId: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  photoUrls: string[];
  status: PrescriptionStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Save prescription metadata to Firestore.
 * Photos are stored as base64 data URLs directly in Firestore
 * (simpler than Firebase Storage for small clinic use).
 */
export async function createPrescription(input: {
  clinicId: ClinicId;
  tokenId: string;
  patientName: string;
  photos: string[]; // base64 data URLs
  createdBy: string;
}): Promise<PrescriptionDoc> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const date = todayDate();

  const data = {
    clinicId: input.clinicId,
    tokenId: input.tokenId,
    patientName: input.patientName,
    date,
    photoUrls: input.photos,
    status: "sent" as PrescriptionStatus,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection("prescriptions").add(data);
  return { id: ref.id, ...data };
}

/**
 * Get today's prescriptions for a clinic (pharmacy dashboard).
 */
export async function getPrescriptionsForDate(
  clinicId?: string,
  date?: string,
): Promise<PrescriptionDoc[]> {
  const db = getAdminDb();
  const targetDate = date || todayDate();

  // Simple query — only filter by date. Clinic filtering done client-side
  // to avoid requiring composite Firestore indexes.
  const snapshot = await db
    .collection("prescriptions")
    .where("date", "==", targetDate)
    .orderBy("createdAt", "desc")
    .get();

  let results = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<PrescriptionDoc, "id">),
  }));

  if (clinicId) {
    results = results.filter((r) => r.clinicId === clinicId);
  }

  return results;
}

/**
 * Update prescription status (preparing / ready).
 */
export async function updatePrescriptionStatus(
  prescriptionId: string,
  status: PrescriptionStatus,
): Promise<void> {
  const db = getAdminDb();
  await db.collection("prescriptions").doc(prescriptionId).update({
    status,
    updatedAt: new Date().toISOString(),
  });
}
