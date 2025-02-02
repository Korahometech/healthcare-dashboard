import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SelectAppointment } from "@db/schema";

interface UpdateAppointmentStatus {
  id: number;
  status: "pending" | "confirmed" | "cancelled";
}

export function useAppointments() {
  const queryClient = useQueryClient();

  const {
    data: appointments = [],
    isLoading,
    error,
  } = useQuery<SelectAppointment[]>({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const response = await fetch("/api/appointments");
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    },
  });

  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: UpdateAppointmentStatus) => {
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update appointment status");
      return response.json();
    },
    onSuccess: (updatedAppointment) => {
      // Update the cache with the new appointment data
      queryClient.setQueryData<SelectAppointment[]>(["/api/appointments"], (old) => {
        if (!old) return [updatedAppointment];
        return old.map((appointment) =>
          appointment.id === updatedAppointment.id ? updatedAppointment : appointment
        );
      });
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  const createAppointment = async (appointmentData: Partial<SelectAppointment>) => {
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appointmentData),
    });
    if (!response.ok) throw new Error("Failed to create appointment");

    const newAppointment = await response.json();
    // Update cache immediately
    queryClient.setQueryData<SelectAppointment[]>(["/api/appointments"], (old) => {
      if (!old) return [newAppointment];
      return [...old, newAppointment];
    });
    // Also invalidate to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    return newAppointment;
  };

  const deleteAppointment = async (id: number) => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete appointment");

    // Update cache immediately
    queryClient.setQueryData<SelectAppointment[]>(["/api/appointments"], (old) => {
      if (!old) return [];
      return old.filter((appointment) => appointment.id !== id);
    });
    // Also invalidate to ensure fresh data
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