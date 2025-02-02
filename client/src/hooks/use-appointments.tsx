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
    staleTime: 0, // Always fetch fresh data
  });

  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: UpdateAppointmentStatus) => {
      console.log('Updating appointment status:', { id, status }); // Debug log
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          // Ensure credentials are included
          credentials: "include",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Status update error:', errorText); // Debug log
        throw new Error(errorText);
      }

      return response.json();
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/appointments"] });

      const previousAppointments = queryClient.getQueryData<SelectAppointment[]>(["/api/appointments"]);

      if (previousAppointments) {
        queryClient.setQueryData<SelectAppointment[]>(["/api/appointments"], 
          previousAppointments.map(appointment => 
            appointment.id === id ? { ...appointment, status } : appointment
          )
        );
      }

      return { previousAppointments };
    },
    onError: (err, variables, context) => {
      console.error('Mutation error:', err); // Debug log
      if (context?.previousAppointments) {
        queryClient.setQueryData(["/api/appointments"], context.previousAppointments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  const createAppointment = async (appointmentData: Partial<SelectAppointment>) => {
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        credentials: "include",
      },
      body: JSON.stringify(appointmentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create appointment error:', errorText); // Debug log
      throw new Error("Failed to create appointment");
    }

    const newAppointment = await response.json();
    queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    return newAppointment;
  };

  const deleteAppointment = async (id: number) => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: "DELETE",
      headers: { credentials: "include" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete appointment error:', errorText); // Debug log
      throw new Error("Failed to delete appointment");
    }

    queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    return response.json();
  };

  return {
    appointments,
    isLoading,
    error,
    updateAppointmentStatus: updateAppointmentStatusMutation.mutateAsync,
    createAppointment,
    deleteAppointment,
  };
}