import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SelectTeleconsultation } from "@db/schema";

type UpdateTeleconsultation = {
  id: number;
  status: string;
  endTime?: Date;
};

export function useTeleconsultations() {
  const queryClient = useQueryClient();

  const { data: teleconsultations = [], isLoading } = useQuery<SelectTeleconsultation[]>({
    queryKey: ["/api/teleconsultations"],
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, endTime }: UpdateTeleconsultation) => {
      const res = await fetch(`/api/teleconsultations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, endTime }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teleconsultations"] });
    },
  });

  return {
    teleconsultations,
    isLoading,
    updateStatus: updateStatus.mutateAsync,
  };
}
