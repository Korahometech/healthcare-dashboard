import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertMedicalHistory, SelectMedicalHistory } from "@db/schema";

export function useMedicalHistory(patientId: number) {
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery<SelectMedicalHistory[]>({
    queryKey: [`/api/patients/${patientId}/medical-history`],
    enabled: !!patientId,
  });

  const addEntry = useMutation({
    mutationFn: async (entry: Omit<InsertMedicalHistory, "patientId">) => {
      const res = await fetch(`/api/patients/${patientId}/medical-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/medical-history`],
      });
    },
  });

  return {
    history,
    isLoading,
    addEntry: addEntry.mutateAsync,
  };
}
