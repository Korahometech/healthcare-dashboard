import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertMedicalRecord, SelectMedicalRecord } from "@db/schema";

export function useMedicalRecords(patientId: number) {
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery<SelectMedicalRecord[]>({
    queryKey: [`/api/patients/${patientId}/medical-records`],
    enabled: !!patientId,
  });

  const uploadRecord = useMutation({
    mutationFn: async (record: Omit<InsertMedicalRecord, "patientId">) => {
      const res = await fetch(`/api/patients/${patientId}/medical-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/medical-records`],
      });
    },
  });

  return {
    records,
    isLoading,
    uploadRecord: uploadRecord.mutateAsync,
  };
}
