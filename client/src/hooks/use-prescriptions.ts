import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertPrescription, SelectPrescription } from "@db/schema";

export function usePrescriptions(patientId: number) {
  const queryClient = useQueryClient();

  const { data: prescriptions = [], isLoading } = useQuery<SelectPrescription[]>({
    queryKey: [`/api/patients/${patientId}/prescriptions`],
    enabled: !!patientId,
  });

  const addPrescription = useMutation({
    mutationFn: async (prescription: Omit<InsertPrescription, "patientId">) => {
      const res = await fetch(`/api/patients/${patientId}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prescription),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/prescriptions`],
      });
    },
  });

  return {
    prescriptions,
    isLoading,
    addPrescription: addPrescription.mutateAsync,
  };
}
