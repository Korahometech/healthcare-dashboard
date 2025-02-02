import { useQuery } from "@tanstack/react-query";
import type { SelectAppointmentAnalytics } from "@db/schema";

export function useAppointmentAnalytics() {
  const getPredictedWaitTime = async (doctorId: number, scheduledTime: Date) => {
    const res = await fetch(
      `/api/appointments/analytics/wait-time?` +
      `doctorId=${doctorId}&` +
      `scheduledTime=${scheduledTime.toISOString()}`
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const startAppointment = async (appointmentId: number) => {
    const res = await fetch(`/api/appointments/${appointmentId}/start`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  return {
    getPredictedWaitTime,
    startAppointment,
  };
}
