import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertDoctor, SelectDoctor } from "@db/schema";

export function useDoctors() {
  const queryClient = useQueryClient();

  const { data: doctors = [], isLoading } = useQuery<SelectDoctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { mutateAsync: createDoctor, isLoading: isCreating } = useMutation({
    mutationFn: async (doctor: InsertDoctor) => {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctor),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
    },
  });

  return {
    doctors,
    isLoading,
    isCreating,
    createDoctor,
  };
}