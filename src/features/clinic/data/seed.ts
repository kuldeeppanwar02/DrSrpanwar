import { getClinicDefinition } from "@/features/clinic/catalog";
import type { ClinicId, ClinicState } from "@/features/clinic/types";

const seedQueues: Record<ClinicId, ClinicState["queue"]> = {
  surgery: [
    {
      id: "entry-s-001",
      clinicId: "surgery",
      clientRequestId: "seed-s-001",
      queueOrder: 1,
      token: "S-001",
      bookingId: "BK-S-001",
      name: "Geeta Devi",
      mobile: "9829012345",
      source: "booking",
      dayLabel: "Aaj",
      slotLabel: "09:00 AM",
      status: "done",
      syncState: "synced",
      createdAt: "2026-04-25T08:40:00.000Z",
      pharmacyStatus: "done",
      requiresPharmacyFollowUp: true,
    },
    {
      id: "entry-s-002",
      clinicId: "surgery",
      clientRequestId: "seed-s-002",
      queueOrder: 2,
      token: "S-002",
      bookingId: "WI-S-002",
      name: "Hanuman Ram",
      mobile: "9988776655",
      source: "walk-in",
      dayLabel: "Aaj",
      slotLabel: "Walk-in",
      status: "in-progress",
      syncState: "synced",
      createdAt: "2026-04-25T08:52:00.000Z",
      requiresPharmacyFollowUp: false,
      pharmacyStatus: "not-needed",
    },
  ],
  dental: [
    {
      id: "entry-d-001",
      clinicId: "dental",
      clientRequestId: "seed-d-001",
      queueOrder: 1,
      token: "D-001",
      bookingId: "BK-D-001",
      name: "Poonam",
      mobile: "9001100110",
      source: "booking",
      dayLabel: "Aaj",
      slotLabel: "10:15 AM",
      status: "in-progress",
      syncState: "synced",
      createdAt: "2026-04-25T09:20:00.000Z",
      requiresPharmacyFollowUp: true,
      pharmacyStatus: "pending",
    },
  ],
  pharmacy: [
    {
      id: "entry-p-001",
      clinicId: "pharmacy",
      clientRequestId: "seed-p-001",
      queueOrder: 1,
      token: "P-001",
      bookingId: "RX-P-001",
      name: "Lakshmi Kanwar",
      mobile: "9667788990",
      source: "walk-in",
      dayLabel: "Aaj",
      slotLabel: "Pickup",
      status: "waiting",
      syncState: "synced",
      createdAt: "2026-04-25T09:35:00.000Z",
      requiresPharmacyFollowUp: false,
      pharmacyStatus: "not-needed",
    },
  ],
};

export function createSeedClinicState(clinicId: ClinicId): ClinicState {
  const clinic = getClinicDefinition(clinicId);

  return {
    clinicId,
    clinicName: clinic.title,
    clinicSubtitle: clinic.subtitle,
    clinicPrefix: clinic.prefix,
    doctorMessage:
      clinicId === "pharmacy"
        ? "Prescription pickup aur follow-up medicines ke liye token lein."
        : "Subah OPD timing mein appointment aur walk-in dono available hain.",
    lastUpdated: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    queue: JSON.parse(JSON.stringify(seedQueues[clinicId])) as ClinicState["queue"],
  };
}
