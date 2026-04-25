import { createSeedClinicState } from "@/features/clinic/data/seed";
import type {
  ClinicState,
  CreateBookingInput,
  CreateWalkInInput,
  QueueEntry,
  QueueStatus,
  QueueSummary,
} from "@/features/clinic/types";

function sanitizeMobile(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

function touchState(state: ClinicState, syncTimestamp?: string): ClinicState {
  return {
    ...state,
    lastUpdated: new Date().toISOString(),
    lastSyncedAt: syncTimestamp ?? state.lastSyncedAt,
  };
}

function shortDateStamp(date = new Date()) {
  const year = date.getFullYear().toString().slice(-2);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${day}${month}${year}`;
}

function getNextNumericToken(queue: QueueEntry[], prefix: "A" | "T") {
  const values = queue
    .filter((entry) => entry.token.startsWith(`${prefix}-`))
    .map((entry) => Number(entry.token.split("-")[1]))
    .filter((value) => Number.isFinite(value));

  return (values.length ? Math.max(...values) : prefix === "A" ? 100 : 0) + 1;
}

function getNextTempSequence(queue: QueueEntry[]) {
  const values = queue
    .flatMap((entry) => [entry.token, entry.provisionalToken])
    .filter((token): token is string => Boolean(token))
    .filter((token) => token.startsWith("TEMP-"))
    .map((token) => Number(token.split("-")[1]))
    .filter((value) => Number.isFinite(value));

  return (values.length ? Math.max(...values) : 0) + 1;
}

function getNextTempReference(queue: QueueEntry[], prefix: "TEMP-BK" | "TEMP-WI") {
  const values = queue
    .flatMap((entry) => [entry.bookingId, entry.provisionalBookingId])
    .filter((bookingId): bookingId is string => Boolean(bookingId))
    .filter((bookingId) => bookingId.startsWith(`${prefix}-`))
    .map((bookingId) => Number(bookingId.split("-")[2]))
    .filter((value) => Number.isFinite(value));

  return (values.length ? Math.max(...values) : 0) + 1;
}

function createRequestId() {
  return `request-${crypto.randomUUID()}`;
}

export function createInitialClinicState() {
  return createSeedClinicState();
}

export function createBookingState(
  state: ClinicState,
  input: CreateBookingInput,
  options: { online: boolean },
) {
  const normalizedMobile = sanitizeMobile(input.mobile);
  const cleanName = input.name.trim();

  if (options.online) {
    const finalNumber = getNextNumericToken(state.queue, "A");
    const token = `A-${String(finalNumber).padStart(3, "0")}`;
    const bookingId = `BK-${shortDateStamp()}-${String(finalNumber).padStart(3, "0")}`;

    return touchState({
      ...state,
      queue: [
        ...state.queue,
        {
          id: `entry-${crypto.randomUUID()}`,
          clientRequestId: createRequestId(),
          token,
          bookingId,
          name: cleanName,
          mobile: normalizedMobile,
          source: "booking",
          dayLabel: input.dayLabel,
          slotLabel: input.slotLabel,
          status: "waiting",
          syncState: "synced",
          createdAt: new Date().toISOString(),
          notes:
            input.dayLabel === "कल" ? "Tomorrow queue slot saved for clinic review" : "",
        },
      ],
    });
  }

  const provisionalNumber = getNextTempSequence(state.queue);
  const provisionalToken = `TEMP-${String(provisionalNumber).padStart(3, "0")}`;
  const provisionalBookingId = `TEMP-BK-${String(
    getNextTempReference(state.queue, "TEMP-BK"),
  ).padStart(3, "0")}`;

  return touchState({
    ...state,
    queue: [
      ...state.queue,
      {
        id: `entry-${crypto.randomUUID()}`,
        clientRequestId: createRequestId(),
        token: provisionalToken,
        bookingId: provisionalBookingId,
        provisionalToken,
        provisionalBookingId,
        name: cleanName,
        mobile: normalizedMobile,
        source: "booking",
        dayLabel: input.dayLabel,
        slotLabel: input.slotLabel,
        status: "waiting",
        syncState: "pending",
        createdAt: new Date().toISOString(),
        notes: "Offline provisional booking. Sync hone par final slot number assign hoga.",
      },
    ],
  });
}

export function createWalkInState(
  state: ClinicState,
  input: CreateWalkInInput,
  options: { online: boolean },
) {
  const cleanName = input.name?.trim() || "Walk-in Patient";
  const normalizedMobile = sanitizeMobile(input.mobile ?? "");

  if (options.online) {
    const finalNumber = getNextNumericToken(state.queue, "T");
    const token = `T-${String(finalNumber).padStart(3, "0")}`;
    const bookingId = `WI-${shortDateStamp()}-${String(finalNumber).padStart(3, "0")}`;

    return touchState({
      ...state,
      queue: [
        ...state.queue,
        {
          id: `entry-${crypto.randomUUID()}`,
          clientRequestId: createRequestId(),
          token,
          bookingId,
          name: cleanName,
          mobile: normalizedMobile,
          source: "walk-in",
          dayLabel: "आज",
          slotLabel: "Walk-in",
          status: "waiting",
          syncState: "synced",
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }

  const provisionalNumber = getNextTempSequence(state.queue);
  const provisionalToken = `TEMP-${String(provisionalNumber).padStart(3, "0")}`;
  const provisionalBookingId = `TEMP-WI-${String(
    getNextTempReference(state.queue, "TEMP-WI"),
  ).padStart(3, "0")}`;

  return touchState({
    ...state,
    queue: [
      ...state.queue,
      {
        id: `entry-${crypto.randomUUID()}`,
        clientRequestId: createRequestId(),
        token: provisionalToken,
        bookingId: provisionalBookingId,
        provisionalToken,
        provisionalBookingId,
        name: cleanName,
        mobile: normalizedMobile,
        source: "walk-in",
        dayLabel: "आज",
        slotLabel: "Walk-in",
        status: "waiting",
        syncState: "pending",
        createdAt: new Date().toISOString(),
        notes: "Offline provisional token. Internet aate hi final number assign hoga.",
      },
    ],
  });
}

export function syncPendingState(state: ClinicState) {
  let nextBookingNumber = getNextNumericToken(state.queue, "A");
  let nextWalkInNumber = getNextNumericToken(state.queue, "T");
  const syncTimestamp = new Date().toISOString();

  const queue = state.queue.map((entry) => {
    if (entry.syncState !== "pending") {
      return entry;
    }

    if (entry.source === "booking") {
      const token = `A-${String(nextBookingNumber).padStart(3, "0")}`;
      const bookingId = `BK-${shortDateStamp()}-${String(nextBookingNumber).padStart(
        3,
        "0",
      )}`;
      nextBookingNumber += 1;

      return {
        ...entry,
        token,
        bookingId,
        syncState: "synced" as const,
        notes: `Synced from ${entry.provisionalToken ?? "offline token"}`,
      };
    }

    const token = `T-${String(nextWalkInNumber).padStart(3, "0")}`;
    const bookingId = `WI-${shortDateStamp()}-${String(nextWalkInNumber).padStart(
      3,
      "0",
    )}`;
    nextWalkInNumber += 1;

    return {
      ...entry,
      token,
      bookingId,
      syncState: "synced" as const,
      notes: `Synced from ${entry.provisionalToken ?? "offline token"}`,
    };
  });

  return touchState(
    {
      ...state,
      queue,
    },
    syncTimestamp,
  );
}

export function advanceQueueState(state: ClinicState) {
  const nextQueue = [...state.queue];
  const currentIndex = nextQueue.findIndex((entry) => entry.status === "in-progress");

  if (currentIndex >= 0) {
    nextQueue[currentIndex] = {
      ...nextQueue[currentIndex],
      status: "done",
    };
  }

  const nextIndex = nextQueue.findIndex((entry) => entry.status === "waiting");

  if (nextIndex >= 0) {
    nextQueue[nextIndex] = {
      ...nextQueue[nextIndex],
      status: "in-progress",
    };
  }

  return touchState({
    ...state,
    queue: nextQueue,
  });
}

export function updateQueueStatusState(
  state: ClinicState,
  entryId: string,
  status: QueueStatus,
) {
  return touchState({
    ...state,
    queue: state.queue.map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            status,
          }
        : status === "in-progress" && entry.status === "in-progress"
          ? {
              ...entry,
              status: "done",
            }
          : entry,
    ),
  });
}

export function rescheduleQueueEntryState(state: ClinicState, entryId: string) {
  const queue = [...state.queue];
  const index = queue.findIndex((entry) => entry.id === entryId);

  if (index < 0) {
    return state;
  }

  const [entry] = queue.splice(index, 1);

  queue.push({
    ...entry,
    dayLabel: "कल",
    slotLabel: "11:30 AM",
    status: "waiting",
    notes: "कल 11:30 AM par rescheduled",
  });

  return touchState({
    ...state,
    queue,
  });
}

export function resetClinicState() {
  return createInitialClinicState();
}

export function getQueueSummary(state: ClinicState): QueueSummary {
  const current =
    state.queue.find((entry) => entry.status === "in-progress") ??
    state.queue.find((entry) => entry.status === "waiting") ??
    null;

  const waiting = state.queue.filter((entry) => entry.status === "waiting");
  const next = current?.status === "in-progress" ? waiting[0] ?? null : waiting[1] ?? null;

  return {
    current,
    next,
    waiting,
    holdCount: state.queue.filter((entry) => entry.status === "hold").length,
    walkIns: state.queue.filter((entry) => entry.source === "walk-in").length,
    bookings: state.queue.filter((entry) => entry.source === "booking").length,
  };
}

export function getEntryPosition(state: ClinicState, entryId: string) {
  const activeQueue = state.queue.filter(
    (entry) =>
      entry.status === "in-progress" ||
      entry.status === "waiting" ||
      entry.status === "hold",
  );

  const index = activeQueue.findIndex((entry) => entry.id === entryId);

  if (index < 0) {
    return null;
  }

  return {
    patientsAhead: Math.max(index, 0),
    estimatedWaitMinutes: Math.max(index, 0) * 12,
  };
}

export function findEntriesByMobile(mobile: string, state: ClinicState) {
  const normalized = sanitizeMobile(mobile);

  if (!normalized) {
    return [];
  }

  return state.queue
    .filter((entry) => sanitizeMobile(entry.mobile) === normalized)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
