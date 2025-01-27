import { useQuery } from "@tanstack/react-query";
import { useLabResults } from "./use-lab-results";
import { usePatients } from "./use-patients";
import {
  analyzeLabResultsTrends,
  calculateHealthRiskFactors,
  calculateHealthConditionsDistribution,
  calculateBMIDistribution
} from "@/lib/analytics";

export function useHealthTrends(patientId?: number) {
  const { results: labResults } = useLabResults(patientId || 0);
  const { patients } = usePatients();

  const healthTrends = useQuery({
    queryKey: ["health-trends", patientId],
    queryFn: () => {
      const labTrends = analyzeLabResultsTrends(labResults);
      const riskFactors = calculateHealthRiskFactors(patients, labResults);
      const conditionsDistribution = calculateHealthConditionsDistribution(patients);
      const bmiDistribution = calculateBMIDistribution(patients);

      return {
        labTrends,
        riskFactors,
        conditionsDistribution,
        bmiDistribution
      };
    },
    enabled: !!(labResults && patients),
  });

  return healthTrends;
}