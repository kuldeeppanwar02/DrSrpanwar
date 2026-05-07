"use client";

import { useState, useEffect } from "react";
import type { ClinicId } from "@/features/clinic/types";
import type { ResolvedDaySchedule } from "@/lib/firebase/schedule-store";

export type ClinicScheduleStatus = "open" | "break" | "closed_for_day" | "on_leave" | "loading" | "error";

export type ClinicLiveState = {
  status: ClinicScheduleStatus;
  message: string;
  isWalkInAllowed: boolean;
  activeShift?: { start: string; end: string; label: string };
  nextAvailableTime?: string;
};

export function useClinicSchedule(clinicId: ClinicId) {
  const [scheduleData, setScheduleData] = useState<{ today: ResolvedDaySchedule; tomorrow: ResolvedDaySchedule } | null>(null);
  const [liveState, setLiveState] = useState<ClinicLiveState>({
    status: "loading",
    message: "Loading schedule...",
    isWalkInAllowed: false,
  });

  // Fetch schedule from API
  useEffect(() => {
    let mounted = true;

    const fetchSchedule = async () => {
      try {
        const res = await fetch(`/api/schedule?mode=resolved&clinic=${clinicId}`);
        if (!res.ok) throw new Error("Failed to fetch schedule");
        const data = await res.json();
        if (mounted) {
          setScheduleData(data);
        }
      } catch (error) {
        if (mounted) {
          setLiveState(prev => ({ ...prev, status: "error", message: "Failed to load schedule." }));
        }
      }
    };

    void fetchSchedule();

    // Refresh data every 5 minutes in case admin changes settings
    const interval = setInterval(fetchSchedule, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [clinicId]);

  // Calculate live state based on current time
  useEffect(() => {
    if (!scheduleData) return;

    const calculateStatus = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

      const { today, tomorrow } = scheduleData;

      // 1. Check for Leave / Full Day Closure
      if (!today.isOpen) {
        const reason = today.override?.reason || "Closed today";
        const nextDayLabel = tomorrow.isOpen ? "tomorrow" : "later";
        
        // If it's a planned override (leave)
        if (today.source === "override") {
          setLiveState({
            status: "on_leave",
            message: `Doctor is on leave: ${reason}. Next available ${nextDayLabel}.`,
            isWalkInAllowed: false,
          });
          return;
        }

        // Just a regular weekly off or closed day
        setLiveState({
          status: "closed_for_day",
          message: `Clinic is closed today. Opens ${nextDayLabel}.`,
          isWalkInAllowed: false,
        });
        return;
      }

      // 2. Check Shifts for Today
      const validShifts = today.shifts.filter(s => s.enabled && !s.closed);
      
      if (validShifts.length === 0) {
        setLiveState({
          status: "closed_for_day",
          message: "No active shifts today.",
          isWalkInAllowed: false,
        });
        return;
      }

      // Find current active shift
      const activeShift = validShifts.find(s => currentTimeStr >= s.startTime && currentTimeStr < s.endTime);
      
      if (activeShift) {
        // We are currently INSIDE a shift
        const formatTime = (time24: string) => {
          const [h, m] = time24.split(":");
          const d = new Date();
          d.setHours(parseInt(h, 10));
          d.setMinutes(parseInt(m, 10));
          return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        };

        setLiveState({
          status: "open",
          message: `Clinic Open • Doctor available till ${formatTime(activeShift.endTime)}`,
          isWalkInAllowed: true,
          activeShift: {
            start: activeShift.startTime,
            end: activeShift.endTime,
            label: activeShift.label,
          }
        });
        return;
      }

      // Find NEXT shift for today
      const upcomingShift = validShifts.find(s => currentTimeStr < s.startTime);

      const formatTime = (time24: string) => {
        const [h, m] = time24.split(":");
        const d = new Date();
        d.setHours(parseInt(h, 10));
        d.setMinutes(parseInt(m, 10));
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      };

      if (upcomingShift) {
        // Between shifts
        setLiveState({
          status: "break",
          message: `Doctor is away. Next shift starts at ${formatTime(upcomingShift.startTime)}.`,
          isWalkInAllowed: true, // Allow taking token for next shift
          nextAvailableTime: formatTime(upcomingShift.startTime),
        });
        return;
      }

      // Day has ended (past all shifts)
      let nextMessage = "Tomorrow";
      if (tomorrow.isOpen) {
        const firstTomorrowShift = tomorrow.shifts.find(s => s.enabled && !s.closed);
        if (firstTomorrowShift) {
          nextMessage = `Tomorrow at ${formatTime(firstTomorrowShift.startTime)}`;
        }
      }

      setLiveState({
        status: "closed_for_day",
        message: `Clinic is closed for today. Opens ${nextMessage}.`,
        isWalkInAllowed: false,
      });
    };

    calculateStatus();

    // Recalculate every minute
    const interval = setInterval(calculateStatus, 60 * 1000);
    return () => clearInterval(interval);

  }, [scheduleData]);

  return liveState;
}
