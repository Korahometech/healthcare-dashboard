import { useQuery } from "@tanstack/react-query";

interface WaitTimeData {
  predictedWaitTime: number;
  confidence: number;
}

export function useAppointmentAnalytics() {
  const getPredictedWaitTime = (doctorId: number, scheduledTime: Date) => {
    return useQuery<WaitTimeData>({
      queryKey: [`/api/appointments/analytics/wait-time`, doctorId, scheduledTime],
      queryFn: async () => {
        const res = await fetch(
          `/api/appointments/analytics/wait-time?` +
          `doctorId=${doctorId}&` +
          `scheduledTime=${scheduledTime.toISOString()}`
        );
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }
        return res.json();
      },
      retry: false,
      enabled: !!doctorId && !!scheduledTime,
    });
  };

  return {
    getPredictedWaitTime,
  };
}