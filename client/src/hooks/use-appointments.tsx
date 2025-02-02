import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SelectAppointment } from "@db/schema";

interface UpdateAppointmentStatus {
  id: number;
  status: string;
}

export function useAppointments() {
  const queryClient = useQueryClient();

  const {
    data: appointments = [],
    isLoading,
    error,
  } = useQuery<SelectAppointment[]>({
    queryKey: ["/api/appointments"],
    refetchOnWindowFocus: true,
  });

  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: UpdateAppointmentStatus) => {
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: (updatedAppointment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  const createAppointment = async (appointmentData: Partial<SelectAppointment>) => {
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appointmentData),
    });

    if (!response.ok) {
      throw new Error("Failed to create appointment");
    }

    const newAppointment = await response.json();
    queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    return newAppointment;
  };

  const deleteAppointment = async (id: number) => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete appointment");
    }

    queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    return response.json();
  };

  return {
    appointments,
    isLoading,
    error,
    updateAppointmentStatus: updateAppointmentStatusMutation.mutate,
    createAppointment,
    deleteAppointment,
  };
}