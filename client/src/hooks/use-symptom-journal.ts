import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertSymptomJournal, SelectSymptomJournal, SelectSymptomAnalysis } from "@db/schema";

type SymptomJournalEntry = InsertSymptomJournal & {
  id?: number;
};

type SymptomJournalWithAnalysis = SelectSymptomJournal & {
  analysis: SelectSymptomAnalysis[];
};

export function useSymptomJournal(patientId: number) {
  const queryClient = useQueryClient();

  const { data: journals = [], isLoading } = useQuery<SymptomJournalWithAnalysis[]>({
    queryKey: [`/api/patients/${patientId}/symptom-journals`],
    enabled: !!patientId,
  });

  const addEntry = useMutation({
    mutationFn: async (entry: Omit<SymptomJournalEntry, "patientId">) => {
      const res = await fetch(`/api/patients/${patientId}/symptom-journals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/symptom-journals`],
      });
    },
  });

  return {
    journals,
    isLoading,
    addEntry: addEntry.mutateAsync,
  };
}
