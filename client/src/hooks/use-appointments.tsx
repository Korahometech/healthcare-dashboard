import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { SelectAppointment } from "@db/schema";

interface UpdateAppointmentStatus {
  id: number;
  status: "pending" | "confirmed" | "cancelled";
}

export function useAppointments() {
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
    onSuccess: () => {
      // Invalidate and refetch appointments after status update
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
    
    // Invalidate and refetch after creating new appointment
    queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    return response.json();
  };

  const deleteAppointment = async (id: number) => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete appointment");
    
    // Invalidate and refetch after deleting appointment
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
