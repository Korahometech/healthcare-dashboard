import { useQuery } from "@tanstack/react-query";
import { useAppointments } from "./use-appointments";
import { useLabResults } from "./use-lab-results";
import { useMedicalHistory } from "./use-medical-history";
import type { TimelineEvent } from "@/components/ui/timeline";

export function usePatientTimeline(patientId: number | null) {
  const { data: appointments = [], isLoading: isLoadingAppointments } = useAppointments();
  const { data: labResults = [], isLoading: isLoadingLabResults } = useLabResults(patientId ?? 0);
  const { history = [], isLoading: isLoadingHistory } = useMedicalHistory(patientId ?? 0);

  return useQuery<TimelineEvent[]>({
    queryKey: [`/api/patients/${patientId}/timeline`, appointments, labResults, history],
    enabled: !!patientId && !isLoadingAppointments && !isLoadingLabResults && !isLoadingHistory,
    queryFn: async () => {
      const timelineEvents: TimelineEvent[] = [];

      // Add appointments to timeline
      appointments.forEach((appointment) => {
        if (appointment.patientId === patientId) {
          timelineEvents.push({
            id: appointment.id,
            type: "appointment",
            title: "Medical Appointment",
            description: appointment.notes || "Regular checkup appointment",
            date: new Date(appointment.date),
            status: appointment.status,
            metadata: {
              notes: appointment.notes || "No additional notes"
            },
          });
        }
      });

      // Add lab results to timeline
      labResults.forEach((result) => {
        timelineEvents.push({
          id: result.id,
          type: "lab_result",
          title: result.testName,
          description: `Result: ${result.value} ${result.unit}`,
          date: new Date(result.testDate),
          status: result.status,
          metadata: {
            value: `${result.value} ${result.unit}`,
            reference_range: result.referenceMin && result.referenceMax ? 
              `${result.referenceMin}-${result.referenceMax} ${result.unit}` : 
              "Not specified",
          },
        });
      });

      // Add medical history events to timeline
      history.forEach((event) => {
        timelineEvents.push({
          id: event.id,
          type: "treatment",
          title: event.title,
          description: event.description || "",
          date: new Date(event.date),
          status: event.status || "completed",
          metadata: event.metadata || {},
        });
      });

      return timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
  });
}