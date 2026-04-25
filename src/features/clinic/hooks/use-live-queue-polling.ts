"use client";

import { useEffect, useEffectEvent } from "react";
import { useClinic } from "@/features/clinic/state/clinic-provider";

export function useLiveQueuePolling(intervalMs = 5000) {
  const { refresh } = useClinic();

  const pollEvent = useEffectEvent(() => {
    void refresh();
  });

  useEffect(() => {
    pollEvent();
    const timer = window.setInterval(() => pollEvent(), intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs]);
}
