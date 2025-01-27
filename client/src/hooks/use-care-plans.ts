import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { 
  InsertCarePlan, 
  SelectCarePlan, 
  InsertTreatment, 
  InsertMedication,
  InsertHealthGoal,
  InsertProgressEntry
} from "@db/schema";

export function useCarePlans(patientId?: number) {
  const queryClient = useQueryClient();

  const { data: carePlans = [], isLoading } = useQuery<SelectCarePlan[]>({
    queryKey: [`/api/patients/${patientId}/care-plans`],
    enabled: !!patientId,
  });

  const createCarePlan = useMutation({
    mutationFn: async (carePlan: Omit<InsertCarePlan, "patientId">) => {
      const res = await fetch(`/api/patients/${patientId}/care-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(carePlan),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/care-plans`],
      });
    },
  });

  const addTreatment = useMutation({
    mutationFn: async ({ carePlanId, treatment }: { carePlanId: number, treatment: Omit<InsertTreatment, "carePlanId"> }) => {
      const res = await fetch(`/api/care-plans/${carePlanId}/treatments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(treatment),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/care-plans`],
      });
    },
  });

  const addMedication = useMutation({
    mutationFn: async ({ carePlanId, medication }: { carePlanId: number, medication: Omit<InsertMedication, "carePlanId"> }) => {
      const res = await fetch(`/api/care-plans/${carePlanId}/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medication),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/care-plans`],
      });
    },
  });

  const addHealthGoal = useMutation({
    mutationFn: async ({ carePlanId, goal }: { carePlanId: number, goal: Omit<InsertHealthGoal, "carePlanId"> }) => {
      const res = await fetch(`/api/care-plans/${carePlanId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goal),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/care-plans`],
      });
    },
  });

  const addProgressEntry = useMutation({
    mutationFn: async ({ goalId, entry }: { goalId: number, entry: Omit<InsertProgressEntry, "healthGoalId"> }) => {
      const res = await fetch(`/api/goals/${goalId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patients/${patientId}/care-plans`],
      });
    },
  });

  return {
    carePlans,
    isLoading,
    createCarePlan: createCarePlan.mutateAsync,
    addTreatment: addTreatment.mutateAsync,
    addMedication: addMedication.mutateAsync,
    addHealthGoal: addHealthGoal.mutateAsync,
    addProgressEntry: addProgressEntry.mutateAsync,
  };
}
