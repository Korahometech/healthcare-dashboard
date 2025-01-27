import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertLabResult, SelectLabResult } from "@db/schema";

export function useLabResults(patientId: number) {
  const queryClient = useQueryClient();

  const { data: results = [], isLoading } = useQuery<SelectLabResult[]>({
    queryKey: [`/api/patients/${patientId}/lab-results`],
    enabled: !!patientId,
  });

  const addResult = useMutation({
    mutationFn: async (result: Omit<InsertLabResult, "patientId">) => {
      const res = await fetch(`/api/patients/${patientId}/lab-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/lab-results`],
      });
    },
  });

  return {
    results,
    isLoading,
    addResult: addResult.mutateAsync,
  };
}
