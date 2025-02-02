import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertAppointment, SelectAppointment } from "@db/schema";
import { apiRequest } from "@/lib/queryClient";

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
    staleTime: 0,
  });

  const createAppointment = useMutation({
    mutationFn: async (appointment: CreateAppointmentInput) => {
      const res = await apiRequest("POST", "/api/appointments", appointment);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  const updateAppointmentStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: string;
    }) => {
      console.log('Updating status via mutation:', { id, status });
      const res = await apiRequest("PUT", `/api/appointments/${id}/status`, { status });
      return res.json();
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/appointments"] });
      const previousAppointments = queryClient.getQueryData<SelectAppointment[]>(["/api/appointments"]);

      if (previousAppointments) {
        queryClient.setQueryData<SelectAppointment[]>(
          ["/api/appointments"],
          previousAppointments.map((appointment) =>
            appointment.id === id ? { ...appointment, status } : appointment
          )
        );
      }

      return { previousAppointments };
    },
    onError: (_, __, context) => {
      console.error('Error in updateAppointmentStatus mutation');
      if (context?.previousAppointments) {
        queryClient.setQueryData(["/api/appointments"], context.previousAppointments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async (appointment: UpdateAppointmentInput) => {
      const res = await apiRequest("PUT", `/api/appointments/${appointment.id}`, appointment);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/appointments/${id}`);
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["/api/appointments"] });
      const previousAppointments = queryClient.getQueryData<SelectAppointment[]>(["/api/appointments"]);

      queryClient.setQueryData<SelectAppointment[]>(
        ["/api/appointments"],
        (old = []) => old.filter(appointment => appointment.id !== deletedId)
      );

      return { previousAppointments };
    },
    onError: (_, __, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(["/api/appointments"], context.previousAppointments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  return {
    appointments,
    isLoading,
    createAppointment: createAppointment.mutateAsync,
    updateAppointmentStatus: updateAppointmentStatus.mutateAsync,
    updateAppointment: updateAppointment.mutateAsync,
    deleteAppointment: deleteAppointment.mutateAsync,
  };
}