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

export type TimeRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

export function useHealthTrends(patientId?: number, timeRange: TimeRange = "6M") {
  const { results: labResults } = useLabResults(patientId || 0);
  const { patients } = usePatients();

  const healthTrends = useQuery({
    queryKey: ["health-trends", patientId, timeRange],
    queryFn: () => {
      const labTrends = analyzeLabResultsTrends(labResults, timeRange);
      const riskFactors = calculateHealthRiskFactors(patients, labResults);
      const conditionsDistribution = calculateHealthConditionsDistribution(patients);
      const bmiDistribution = calculateBMIDistribution(patients);
      const metricCorrelations = calculateMetricCorrelation(patients, labResults);
      const detailedTrends = calculateHealthTrends(patients, labResults, timeRange);
      const predictions = predictHealthTrends(labResults);

      return {
        labTrends,
        riskFactors,
        conditionsDistribution,
        bmiDistribution,
        metricCorrelations,
        detailedTrends,
        predictions,
        timeRange
      };
    },
    enabled: !!(labResults && patients),
  });

  return healthTrends;
}