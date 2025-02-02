import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertSymptomJournal, SelectSymptomJournal, SelectSymptomAnalysis } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

type SymptomJournalEntry = InsertSymptomJournal & {
  id?: number;
};

type SymptomJournalWithAnalysis = SelectSymptomJournal & {
  analysis: SelectSymptomAnalysis[];
};

export function useSymptomJournal(patientId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

      if (!res.ok) {
        const errorText = await res.text();
        // Check if it's an API key error
        if (errorText.includes("API key")) {
          toast({
            title: "API Error",
            description: "There was an issue with the API configuration. Please try again later.",
            variant: "destructive",
          });
          throw new Error("API configuration error");
        }
        throw new Error(errorText);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/symptom-journals`],
      });
      toast({
        title: "Success",
        description: "Symptom journal entry added successfully",
      });
    },
    onError: (error: Error) => {
      if (!error.message.includes("API configuration error")) {
        toast({
          title: "Error",
          description: "Failed to add symptom journal entry. Please try again.",
          variant: "destructive",
        });
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on API configuration errors
      if (error.message.includes("API configuration error")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    journals,
    isLoading,
    addEntry: addEntry.mutateAsync,
  };
}