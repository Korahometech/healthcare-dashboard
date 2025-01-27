import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertGeneticProfile, SelectGeneticProfile } from "@db/schema";

export function useGeneticProfiles(patientId?: number) {
  const queryClient = useQueryClient();

  const { data: geneticProfiles = [], isLoading } = useQuery<SelectGeneticProfile[]>({
    queryKey: [patientId ? `/api/patients/${patientId}/genetic-profiles` : '/api/genetic-profiles'],
    enabled: true,
  });

  const createGeneticProfile = useMutation({
    mutationFn: async (data: InsertGeneticProfile) => {
      const response = await fetch("/api/genetic-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [patientId ? `/api/patients/${patientId}/genetic-profiles` : '/api/genetic-profiles'],
      });
    },
  });

  return {
    geneticProfiles,
    isLoading,
    createGeneticProfile: createGeneticProfile.mutateAsync,
    isCreating: createGeneticProfile.isPending,
    error: createGeneticProfile.error,
  };
}