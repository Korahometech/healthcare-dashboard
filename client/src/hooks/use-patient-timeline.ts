import { useQuery } from "@tanstack/react-query";
import { useAppointments } from "./use-appointments";
import { useLabResults } from "./use-lab-results";
import { useMedicalHistory } from "./use-medical-history";
import type { TimelineEvent } from "@/components/ui/timeline";

export function usePatientTimeline(patientId: number | null) {
  const { appointments = [], isLoading: isLoadingAppointments } = useAppointments();
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
            title: appointment.type || "Medical Appointment",
            description: appointment.notes || "Regular checkup appointment",
            date: new Date(appointment.date),
            status: appointment.status,
            providers: appointment.doctorId ? [{
              name: appointment.doctorName || "Doctor",
              role: appointment.doctorSpecialty || "Physician"
            }] : undefined,
            metadata: {
              location: appointment.location || "Main Clinic",
              duration: appointment.duration || "30 mins",
              type: appointment.type || "Regular Checkup",
              notes: appointment.notes || "No additional notes"
            },
          });
        }
      });

      // Add lab results to timeline
      labResults.forEach((result) => {
        const isAbnormal = result.value < (result.referenceMin || 0) || result.value > (result.referenceMax || 0);
        timelineEvents.push({
          id: result.id,
          type: "lab_result",
          title: result.testName,
          description: `Result: ${result.value} ${result.unit}`,
          date: new Date(result.testDate),
          status: result.status,
          severity: isAbnormal ? "high" : "low",
          metadata: {
            value: `${result.value} ${result.unit}`,
            reference_range: result.referenceMin && result.referenceMax ? 
              `${result.referenceMin}-${result.referenceMax} ${result.unit}` : 
              "Not specified",
            lab_name: result.labName || "Main Laboratory",
            ordering_provider: result.orderingProvider || "Not specified"
          },
        });
      });

      // Add medical history events to timeline
      history.forEach((event) => {
        timelineEvents.push({
          id: event.id,
          type: event.type as TimelineEvent["type"],
          title: event.title,
          description: event.description || "",
          date: new Date(event.date),
          status: event.status || "completed",
          severity: event.severity as "low" | "medium" | "high" | undefined,
          providers: event.providers,
          metadata: event.metadata || {},
        });
      });

      return timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
  });
}