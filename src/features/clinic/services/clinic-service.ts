import { isRemoteSyncEnabled } from "@/config/env";
import { apiClient } from "@/services/api";
import {
  advanceQueueState,
  createBookingState,
  createInitialClinicState,
  createWalkInState,
  rescheduleQueueEntryState,
  resetClinicState as createResetState,
  syncPendingState,
  updateQueueStatusState,
} from "@/features/clinic/services/queue-engine";
import { readClinicState, writeClinicState } from "@/features/clinic/storage/indexed-db";
import type {
  ClinicState,
  CreateBookingInput,
  CreateWalkInInput,
  QueueStatus,
} from "@/features/clinic/types";

async function persistState(state: ClinicState) {
  await writeClinicState(state);
  return state;
}

export const clinicService = {
  async loadState() {
    const state = await readClinicState();

    if (state.queue.length === 0) {
      const seeded = createInitialClinicState();
      await writeClinicState(seeded);
      return seeded;
    }

    return state;
  },

  async resetState() {
    return persistState(createResetState());
  },

  async createBooking(input: CreateBookingInput, options: { online: boolean }) {
    const state = await readClinicState();
    const nextState = createBookingState(state, input, options);
    return persistState(nextState);
  },

  async createWalkIn(input: CreateWalkInInput, options: { online: boolean }) {
    const state = await readClinicState();
    const nextState = createWalkInState(state, input, options);
    return persistState(nextState);
  },

  async syncPendingEntries() {
    const state = await readClinicState();
    const pendingEntries = state.queue.filter((entry) => entry.syncState === "pending");

    if (pendingEntries.length === 0) {
      return state;
    }

    if (isRemoteSyncEnabled()) {
      try {
        await apiClient.post("/queue/sync", {
          pendingEntries: pendingEntries.map((entry) => ({
            clientRequestId: entry.clientRequestId,
            source: entry.source,
            name: entry.name,
            mobile: entry.mobile,
            dayLabel: entry.dayLabel,
            slotLabel: entry.slotLabel,
            provisionalToken: entry.provisionalToken,
          })),
        });
      } catch {
        // Prototype fallback: if remote sync is unavailable we still finalize locally.
      }
    }

    return persistState(syncPendingState(state));
  },

  async advanceQueue() {
    const state = await readClinicState();
    return persistState(advanceQueueState(state));
  },

  async updateQueueStatus(entryId: string, status: QueueStatus) {
    const state = await readClinicState();
    return persistState(updateQueueStatusState(state, entryId, status));
  },

  async rescheduleQueueEntry(entryId: string) {
    const state = await readClinicState();
    return persistState(rescheduleQueueEntryState(state, entryId));
  },
};
