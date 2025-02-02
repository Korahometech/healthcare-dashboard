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
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the data
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
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/appointments"] });

      // Snapshot the previous value
      const previousAppointments = queryClient.getQueryData<SelectAppointment[]>(["/api/appointments"]);

      // Optimistically update to the new value
      if (previousAppointments) {
        queryClient.setQueryData<SelectAppointment[]>(["/api/appointments"], old => {
          if (!old) return previousAppointments;
          return old.map(appointment =>
            appointment.id === id ? { ...appointment, status } : appointment
          );
        });
      }

      return { previousAppointments };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAppointments) {
        queryClient.setQueryData(["/api/appointments"], context.previousAppointments);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
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
    // Immediately update the cache with optimistic data
    queryClient.setQueryData<SelectAppointment[]>(["/api/appointments"], old => {
      if (!old) return [newAppointment];
      return [...old, newAppointment];
    });

    // Force a refetch to ensure data consistency
    queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    return newAppointment;
  };

  const deleteAppointment = async (id: number) => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete appointment");

    // Immediately update the cache
    queryClient.setQueryData<SelectAppointment[]>(["/api/appointments"], old => {
      if (!old) return [];
      return old.filter(appointment => appointment.id !== id);
    });

    // Force a refetch to ensure data consistency
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