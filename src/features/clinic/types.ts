export type QueueSource = "booking" | "walk-in";
export type QueueStatus =
  | "waiting"
  | "in-progress"
  | "hold"
  | "done"
  | "skipped";
export type SyncState = "synced" | "pending";

export type QueueEntry = {
  id: string;
  clientRequestId: string;
  token: string;
  bookingId: string;
  name: string;
  mobile: string;
  source: QueueSource;
  dayLabel: string;
  slotLabel: string;
  status: QueueStatus;
  syncState: SyncState;
  createdAt: string;
  notes?: string;
  provisionalToken?: string;
  provisionalBookingId?: string;
};

export type ClinicState = {
  doctorMessage: string;
  lastUpdated: string;
  lastSyncedAt?: string;
  queue: QueueEntry[];
};

export type CreateBookingInput = {
  dayLabel: string;
  slotLabel: string;
  name: string;
  mobile: string;
};

export type CreateWalkInInput = {
  name?: string;
  mobile?: string;
};

export type QueueSummary = {
  current: QueueEntry | null;
  next: QueueEntry | null;
  waiting: QueueEntry[];
  holdCount: number;
  walkIns: number;
  bookings: number;
};
