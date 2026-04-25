import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import type { ClinicId } from "@/features/clinic/types";

export type PatientVisit = {
  id: string;
  mobile: string;
  name: string;
  clinicId: ClinicId;
  token: string;
  bookingId: string;
  source: "booking" | "walk-in";
  dayLabel: string;
  slotLabel: string;
  status: string;
  visitDate: string;
  createdAt: string;
};

/**
 * Save a visit record when a patient's queue entry is marked "done".
 */
export async function saveVisitRecord(
  mobile: string,
  name: string,
  clinicId: ClinicId,
  data: {
    token: string;
    bookingId: string;
    source: "booking" | "walk-in";
    dayLabel: string;
    slotLabel: string;
  },
): Promise<void> {
  if (!mobile || mobile.length < 10) return;

  const db = getAdminDb();
  const now = new Date();

  await db.collection("patient_visits").add({
    mobile: mobile.replace(/\D/g, "").slice(-10),
    name,
    clinicId,
    token: data.token,
    bookingId: data.bookingId,
    source: data.source,
    dayLabel: data.dayLabel,
    slotLabel: data.slotLabel,
    status: "done",
    visitDate: now.toISOString().split("T")[0],
    createdAt: now.toISOString(),
  });
}

/**
 * Get patient visit history for last 6 months by mobile number.
 */
export async function getPatientHistory(
  mobile: string,
): Promise<PatientVisit[]> {
  if (!mobile || mobile.replace(/\D/g, "").length < 10) return [];

  const db = getAdminDb();
  const normalizedMobile = mobile.replace(/\D/g, "").slice(-10);

  // 6 months ago
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const cutoffDate = sixMonthsAgo.toISOString();

  const snapshot = await db
    .collection("patient_visits")
    .where("mobile", "==", normalizedMobile)
    .where("createdAt", ">=", cutoffDate)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<PatientVisit, "id">),
  }));
}

/**
 * Get visit count summary for a patient.
 */
export async function getPatientVisitSummary(
  mobile: string,
): Promise<{ totalVisits: number; lastVisitDate: string | null; clinicBreakdown: Record<string, number> }> {
  const visits = await getPatientHistory(mobile);

  const clinicBreakdown: Record<string, number> = {};
  for (const visit of visits) {
    clinicBreakdown[visit.clinicId] = (clinicBreakdown[visit.clinicId] || 0) + 1;
  }

  return {
    totalVisits: visits.length,
    lastVisitDate: visits.length > 0 ? visits[0].visitDate : null,
    clinicBreakdown,
  };
}
