import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertPatient, SelectPatient } from "@db/schema";

export function usePatients() {
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery<SelectPatient[]>({
    queryKey: ["/api/patients"],
  });

  const createPatient = useMutation({
    mutationFn: async (patient: InsertPatient) => {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patient),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
    },
  });

  const deletePatient = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/patients/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
    },
  });

  return {
    patients,
    isLoading,
    createPatient: createPatient.mutateAsync,
    deletePatient: deletePatient.mutateAsync,
  };
}
