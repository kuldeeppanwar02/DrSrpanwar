"use client";

import {
  createContext,
  startTransition,
  use,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { clinicService } from "@/features/clinic/services/clinic-service";
import { createInitialClinicState } from "@/features/clinic/services/queue-engine";
import type {
  ClinicState,
  CreateBookingInput,
  CreateWalkInInput,
  QueueStatus,
} from "@/features/clinic/types";

type ClinicContextValue = {
  state: ClinicState;
  isReady: boolean;
  isOnline: boolean;
  syncInFlight: boolean;
  refresh: () => Promise<void>;
  createBooking: (input: CreateBookingInput) => Promise<ClinicState>;
  createWalkIn: (input: CreateWalkInInput) => Promise<ClinicState>;
  syncPendingEntries: () => Promise<ClinicState>;
  advanceQueue: () => Promise<ClinicState>;
  updateQueueStatus: (entryId: string, status: QueueStatus) => Promise<ClinicState>;
  rescheduleQueueEntry: (entryId: string) => Promise<ClinicState>;
  resetClinicState: () => Promise<ClinicState>;
};

const ClinicContext = createContext<ClinicContextValue | null>(null);

function browserOnline() {
  return typeof window === "undefined" ? true : window.navigator.onLine;
}

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ClinicState>(() => createInitialClinicState());
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(() => browserOnline());
  const [syncInFlight, setSyncInFlight] = useState(false);

  const applyState = (nextState: ClinicState) => {
    startTransition(() => {
      setState(nextState);
    });

    return nextState;
  };

  const refresh = async () => {
    const nextState = await clinicService.loadState();
    applyState(nextState);
    setIsReady(true);
  };

  const syncPendingEntries = async () => {
    setSyncInFlight(true);

    try {
      const nextState = await clinicService.syncPendingEntries();
      return applyState(nextState);
    } finally {
      setSyncInFlight(false);
    }
  };

  const refreshEffect = useEffectEvent(() => {
    void refresh();
  });

  const syncPendingEffect = useEffectEvent(() => {
    void syncPendingEntries();
  });

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const nextState = await clinicService.loadState();

      if (!isMounted) {
        return;
      }

      applyState(nextState);
      setIsReady(true);
    };

    void bootstrap();

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingEffect();
    };

    const handleOffline = () => setIsOnline(false);
    const handleFocus = () => refreshEffect();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const value: ClinicContextValue = {
    state,
    isReady,
    isOnline,
    syncInFlight,
    refresh,
    createBooking: async (input) => {
      const nextState = await clinicService.createBooking(input, { online: isOnline });
      return applyState(nextState);
    },
    createWalkIn: async (input) => {
      const nextState = await clinicService.createWalkIn(input, { online: isOnline });
      return applyState(nextState);
    },
    syncPendingEntries,
    advanceQueue: async () => {
      const nextState = await clinicService.advanceQueue();
      return applyState(nextState);
    },
    updateQueueStatus: async (entryId, status) => {
      const nextState = await clinicService.updateQueueStatus(entryId, status);
      return applyState(nextState);
    },
    rescheduleQueueEntry: async (entryId) => {
      const nextState = await clinicService.rescheduleQueueEntry(entryId);
      return applyState(nextState);
    },
    resetClinicState: async () => {
      const nextState = await clinicService.resetState();
      return applyState(nextState);
    },
  };

  return (
    <ClinicContext value={value}>
      {children}
    </ClinicContext>
  );
}

export function useClinic() {
  const context = use(ClinicContext);

  if (!context) {
    throw new Error("useClinic must be used within ClinicProvider");
  }

  return context;
}
