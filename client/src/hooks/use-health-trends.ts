import { useQuery } from "@tanstack/react-query";
import { useLabResults } from "./use-lab-results";
import { usePatients } from "./use-patients";
import {
  analyzeLabResultsTrends,
  calculateHealthRiskFactors,
  calculateHealthConditionsDistribution,
  calculateBMIDistribution,
  calculateMetricCorrelation,
  calculateHealthTrends,
  predictHealthTrends
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
      const metricCorrelations = calculateMetricCorrelation(patients, labResults);
      const detailedTrends = calculateHealthTrends(patients, labResults);
      const predictions = predictHealthTrends(labResults);

      return {
        labTrends,
        riskFactors,
        conditionsDistribution,
        bmiDistribution,
        metricCorrelations,
        detailedTrends,
        predictions
      };
    },
    enabled: !!(labResults && patients),
  });

  return healthTrends;
}