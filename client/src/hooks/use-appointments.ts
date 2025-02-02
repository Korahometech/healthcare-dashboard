import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertAppointment, SelectAppointment } from "@db/schema";

type CreateAppointmentInput = InsertAppointment & {
  isTeleconsultation?: boolean;
  meetingUrl?: string;
  duration?: number;
};

type UpdateAppointmentInput = Partial<InsertAppointment> & {
  id: number;
  reschedulingReason?: string;
};

export function useAppointments() {
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery<SelectAppointment[]>({
    queryKey: ["/api/appointments"],
  });

  const createAppointment = useMutation({
    mutationFn: async (appointment: CreateAppointmentInput) => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: string;
    }) => {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async (appointment: UpdateAppointmentInput) => {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to delete appointment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  return {
    appointments,
    isLoading,
    createAppointment: createAppointment.mutateAsync,
    updateStatus: updateStatus.mutateAsync,
    updateAppointment: updateAppointment.mutateAsync,
    deleteAppointment: deleteAppointment.mutateAsync,
  };
}