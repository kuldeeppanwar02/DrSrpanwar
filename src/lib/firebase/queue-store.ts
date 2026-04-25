import "server-only";

import { randomUUID } from "crypto";
import { getClinicDefinition } from "@/features/clinic/catalog";
import { createEmptyClinicState } from "@/features/clinic/services/queue-engine";
import type {
  ClinicId,
  ClinicState,
  CreateBookingInput,
  CreateWalkInInput,
  QueueEntry,
  QueueSource,
  QueueStatus,
} from "@/features/clinic/types";
import { getAdminDb } from "@/lib/firebase/admin";

const CLINICS_COLLECTION = "clinics";
const QUEUE_SUBCOLLECTION = "queue";

type ClinicDocument = Omit<ClinicState, "queue"> & {
  nextTokenNumber: number;
  nextQueueOrder: number;
};

type PendingSyncEntry = {
  clientRequestId: string;
  createdAt?: string;
  source: QueueSource;
  name: string;
  mobile: string;
  dayLabel: string;
  slotLabel: string;
  provisionalToken?: string;
  provisionalBookingId?: string;
  requiresPharmacyFollowUp?: boolean;
};

function sanitizeMobile(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

function padSequence(value: number) {
  return String(value).padStart(3, "0");
}

function getBookingIdPrefix(clinicId: ClinicId, source: QueueSource) {
  if (clinicId === "pharmacy") {
    return "RX";
  }

  return source === "booking" ? "BK" : "WI";
}

function createClinicDocument(clinicId: ClinicId): ClinicDocument {
  const baseState = createEmptyClinicState(clinicId);

  return {
    ...baseState,
    nextTokenNumber: 1,
    nextQueueOrder: 1,
  };
}

function clinicDocRef(clinicId: ClinicId) {
  return getAdminDb().collection(CLINICS_COLLECTION).doc(clinicId);
}

function queueCollectionRef(clinicId: ClinicId) {
  return clinicDocRef(clinicId).collection(QUEUE_SUBCOLLECTION);
}

async function ensureClinicInitialized(clinicId: ClinicId) {
  const clinicRef = clinicDocRef(clinicId);

  await getAdminDb().runTransaction(async (transaction) => {
    const clinicSnapshot = await transaction.get(clinicRef);

    if (!clinicSnapshot.exists) {
      transaction.set(clinicRef, createClinicDocument(clinicId));
    }
  });
}

function normalizeClinicState(
  clinicId: ClinicId,
  clinicDocument: Partial<ClinicDocument> | undefined,
  queue: QueueEntry[],
): ClinicState {
  const clinic = getClinicDefinition(clinicId);

  return {
    clinicId,
    clinicName: clinicDocument?.clinicName ?? clinic.title,
    clinicSubtitle: clinicDocument?.clinicSubtitle ?? clinic.subtitle,
    clinicPrefix: clinicDocument?.clinicPrefix ?? clinic.prefix,
    doctorMessage:
      clinicDocument?.doctorMessage ??
      (clinicId === "pharmacy"
        ? "Medicines aur follow-up pickup ke liye token lein."
        : "Appointment aur walk-in dono available hain."),
    lastUpdated: clinicDocument?.lastUpdated ?? new Date().toISOString(),
    lastSyncedAt: clinicDocument?.lastSyncedAt ?? new Date().toISOString(),
    queue: queue
      .map((entry, index) => ({
        ...entry,
        queueOrder: entry.queueOrder ?? index + 1,
      }))
      .sort((first, second) => {
        const firstOrder = first.queueOrder ?? Number.MAX_SAFE_INTEGER;
        const secondOrder = second.queueOrder ?? Number.MAX_SAFE_INTEGER;

        if (firstOrder === secondOrder) {
          return first.createdAt.localeCompare(second.createdAt);
        }

        return firstOrder - secondOrder;
      }),
  };
}

async function readClinicQueue(clinicId: ClinicId) {
  const queueSnapshot = await queueCollectionRef(clinicId)
    .orderBy("queueOrder", "asc")
    .get();

  return queueSnapshot.docs.map((document) => {
    const data = document.data() as QueueEntry;

    return {
      ...data,
      id: data.id || document.id,
      clientRequestId: data.clientRequestId || document.id,
      clinicId,
    };
  });
}

export async function getRemoteClinicState(clinicId: ClinicId) {
  await ensureClinicInitialized(clinicId);
  const [clinicSnapshot, queue] = await Promise.all([
    clinicDocRef(clinicId).get(),
    readClinicQueue(clinicId),
  ]);

  return normalizeClinicState(
    clinicId,
    clinicSnapshot.data() as Partial<ClinicDocument> | undefined,
    queue,
  );
}

function createQueueEntry(
  clinicId: ClinicId,
  clinicDocument: ClinicDocument,
  input: PendingSyncEntry,
) {
  const clinic = getClinicDefinition(clinicId);
  const tokenNumber = clinicDocument.nextTokenNumber;
  const queueOrder = clinicDocument.nextQueueOrder;
  const token = `${clinic.prefix}-${padSequence(tokenNumber)}`;
  const bookingId = `${getBookingIdPrefix(clinicId, input.source)}-${clinic.prefix}-${padSequence(
    tokenNumber,
  )}`;
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    entry: {
      id: input.clientRequestId,
      clinicId,
      clientRequestId: input.clientRequestId,
      queueOrder,
      token,
      bookingId,
      name: input.name.trim() || "Walk-in Patient",
      mobile: sanitizeMobile(input.mobile),
      source: input.source,
      dayLabel: input.dayLabel,
      slotLabel: input.slotLabel,
      status: "waiting" as const,
      syncState: "synced" as const,
      createdAt,
      updatedAt: createdAt,
      notes: input.provisionalToken
        ? `Synced from ${input.provisionalToken}`
        : undefined,
      requiresPharmacyFollowUp: Boolean(input.requiresPharmacyFollowUp),
      pharmacyStatus: input.requiresPharmacyFollowUp ? "pending" : "not-needed",
    } satisfies QueueEntry,
    nextClinicDocument: {
      ...clinicDocument,
      nextTokenNumber: tokenNumber + 1,
      nextQueueOrder: queueOrder + 1,
    },
  };
}

async function upsertRemoteEntries(clinicId: ClinicId, entries: PendingSyncEntry[]) {
  const clinicRef = clinicDocRef(clinicId);
  const queueRef = queueCollectionRef(clinicId);
  const syncTimestamp = new Date().toISOString();

  await ensureClinicInitialized(clinicId);

  await getAdminDb().runTransaction(async (transaction) => {
    const clinicSnapshot = await transaction.get(clinicRef);
    let clinicDocument = clinicSnapshot.exists
      ? (clinicSnapshot.data() as ClinicDocument)
      : createClinicDocument(clinicId);
    let touched = false;

    for (const pendingEntry of entries) {
      const requestId = pendingEntry.clientRequestId || `request-${randomUUID()}`;
      const entryRef = queueRef.doc(requestId);
      const entrySnapshot = await transaction.get(entryRef);

      if (entrySnapshot.exists) {
        continue;
      }

      const { entry, nextClinicDocument } = createQueueEntry(clinicId, clinicDocument, {
        ...pendingEntry,
        clientRequestId: requestId,
      });

      transaction.set(entryRef, entry);
      clinicDocument = nextClinicDocument;
      touched = true;
    }

    if (touched || !clinicSnapshot.exists) {
      transaction.set(
        clinicRef,
        {
          ...clinicDocument,
          lastUpdated: syncTimestamp,
          lastSyncedAt: syncTimestamp,
        },
        { merge: true },
      );
    }
  });

  return getRemoteClinicState(clinicId);
}

export async function createRemoteBooking(input: CreateBookingInput) {
  return upsertRemoteEntries(input.clinicId, [
    {
      clientRequestId: input.clientRequestId || `request-${randomUUID()}`,
      createdAt: input.createdAt,
      source: "booking",
      name: input.name,
      mobile: input.mobile,
      dayLabel: input.dayLabel,
      slotLabel: input.slotLabel,
      requiresPharmacyFollowUp: input.requiresPharmacyFollowUp,
    },
  ]);
}

export async function createRemoteWalkIn(input: CreateWalkInInput) {
  const clinic = getClinicDefinition(input.clinicId);

  return upsertRemoteEntries(input.clinicId, [
    {
      clientRequestId: input.clientRequestId || `request-${randomUUID()}`,
      createdAt: input.createdAt,
      source: "walk-in",
      name: input.name?.trim() || "Walk-in Patient",
      mobile: input.mobile ?? "",
      dayLabel: "Aaj",
      slotLabel: clinic.id === "pharmacy" ? "Pickup" : "Walk-in",
      requiresPharmacyFollowUp: input.requiresPharmacyFollowUp,
    },
  ]);
}

export async function syncRemotePendingEntries(
  clinicId: ClinicId,
  pendingEntries: PendingSyncEntry[],
) {
  return upsertRemoteEntries(clinicId, pendingEntries);
}

export async function advanceRemoteQueue(clinicId: ClinicId) {
  const clinicRef = clinicDocRef(clinicId);
  const queueQuery = queueCollectionRef(clinicId).orderBy("queueOrder", "asc");
  const updateTimestamp = new Date().toISOString();

  await ensureClinicInitialized(clinicId);

  await getAdminDb().runTransaction(async (transaction) => {
    const queueSnapshot = await transaction.get(queueQuery);
    const currentEntry = queueSnapshot.docs.find(
      (document) => (document.data() as QueueEntry).status === "in-progress",
    );

    if (currentEntry) {
      transaction.update(currentEntry.ref, {
        status: "done",
        updatedAt: updateTimestamp,
      });
    }

    const nextEntry = queueSnapshot.docs.find(
      (document) => (document.data() as QueueEntry).status === "waiting",
    );

    if (nextEntry) {
      transaction.update(nextEntry.ref, {
        status: "in-progress",
        updatedAt: updateTimestamp,
      });
    }

    if (currentEntry || nextEntry) {
      transaction.set(
        clinicRef,
        {
          lastUpdated: updateTimestamp,
          lastSyncedAt: updateTimestamp,
        },
        { merge: true },
      );
    }
  });

  return getRemoteClinicState(clinicId);
}

export async function updateRemoteQueueEntryStatus(
  clinicId: ClinicId,
  entryId: string,
  status: QueueStatus,
) {
  const clinicRef = clinicDocRef(clinicId);
  const queueRef = queueCollectionRef(clinicId).doc(entryId);
  const queueQuery = queueCollectionRef(clinicId).orderBy("queueOrder", "asc");
  const updateTimestamp = new Date().toISOString();

  await ensureClinicInitialized(clinicId);

  await getAdminDb().runTransaction(async (transaction) => {
    const entrySnapshot = await transaction.get(queueRef);

    if (!entrySnapshot.exists) {
      throw new Error("Queue entry not found.");
    }

    if (status === "in-progress") {
      const queueSnapshot = await transaction.get(queueQuery);

      for (const document of queueSnapshot.docs) {
        if (
          document.id !== entryId &&
          (document.data() as QueueEntry).status === "in-progress"
        ) {
          transaction.update(document.ref, {
            status: "done",
            updatedAt: updateTimestamp,
          });
        }
      }
    }

    transaction.update(queueRef, {
      status,
      updatedAt: updateTimestamp,
    });

    transaction.set(
      clinicRef,
      {
        lastUpdated: updateTimestamp,
        lastSyncedAt: updateTimestamp,
      },
      { merge: true },
    );
  });

  return getRemoteClinicState(clinicId);
}

export async function rescheduleRemoteQueueEntry(clinicId: ClinicId, entryId: string) {
  const clinicRef = clinicDocRef(clinicId);
  const queueRef = queueCollectionRef(clinicId).doc(entryId);
  const updateTimestamp = new Date().toISOString();

  await ensureClinicInitialized(clinicId);

  await getAdminDb().runTransaction(async (transaction) => {
    const [clinicSnapshot, entrySnapshot] = await Promise.all([
      transaction.get(clinicRef),
      transaction.get(queueRef),
    ]);

    if (!entrySnapshot.exists) {
      throw new Error("Queue entry not found.");
    }

    const clinicDocument = clinicSnapshot.exists
      ? (clinicSnapshot.data() as ClinicDocument)
      : createClinicDocument(clinicId);
    const nextQueueOrder = clinicDocument.nextQueueOrder;

    transaction.update(queueRef, {
      dayLabel: "Kal",
      slotLabel: clinicId === "pharmacy" ? "Pickup" : "11:30 AM",
      status: "waiting",
      queueOrder: nextQueueOrder,
      updatedAt: updateTimestamp,
      notes:
        clinicId === "pharmacy"
          ? "Medicine pickup kept for next availability."
          : "Kal 11:30 AM par rescheduled",
    });

    transaction.set(
      clinicRef,
      {
        nextQueueOrder: nextQueueOrder + 1,
        lastUpdated: updateTimestamp,
        lastSyncedAt: updateTimestamp,
      },
      { merge: true },
    );
  });

  return getRemoteClinicState(clinicId);
}

export async function resetRemoteClinicQueue(clinicId: ClinicId) {
  await ensureClinicInitialized(clinicId);

  const queueSnapshot = await queueCollectionRef(clinicId).get();
  const batch = getAdminDb().batch();

  for (const document of queueSnapshot.docs) {
    batch.delete(document.ref);
  }

  batch.set(clinicDocRef(clinicId), createClinicDocument(clinicId));
  await batch.commit();

  return getRemoteClinicState(clinicId);
}
