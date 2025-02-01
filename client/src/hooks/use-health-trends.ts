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
export type Specialty = "general" | "cardiology" | "endocrinology" | "neurology" | "pediatrics" | "oncology";

export interface MetricGroup {
  id: string;
  name: string;
  metrics: string[];
  priority: "low" | "medium" | "high";
  thresholds?: {
    warning: number;
    critical: number;
  };
}

export function useHealthTrends(
  patientId?: number, 
  timeRange: TimeRange = "6M",
  specialty: Specialty = "general",
  customMetricGroups: MetricGroup[] = []
) {
  const { results: labResults } = useLabResults(patientId || 0);
  const { patients } = usePatients();

  const healthTrends = useQuery({
    queryKey: ["health-trends", patientId, timeRange, specialty, customMetricGroups],
    queryFn: () => {
      const labTrends = analyzeLabResultsTrends(labResults, timeRange);
      const riskFactors = calculateHealthRiskFactors(patients, labResults);
      const conditionsDistribution = calculateHealthConditionsDistribution(patients);
      const bmiDistribution = calculateBMIDistribution(patients);
      const metricCorrelations = calculateMetricCorrelation(patients, labResults);
      const detailedTrends = calculateHealthTrends(patients, labResults, timeRange);
      const predictions = predictHealthTrends(labResults);

      // Filter and organize metrics based on specialty and custom groups
      const specialtyMetrics = filterMetricsBySpecialty(
        labTrends,
        detailedTrends,
        specialty,
        customMetricGroups
      );

      // Calculate critical alerts based on thresholds
      const alerts = calculateCriticalAlerts(
        specialtyMetrics,
        customMetricGroups
      );

      return {
        ...specialtyMetrics,
        riskFactors,
        conditionsDistribution,
        bmiDistribution,
        metricCorrelations,
        predictions,
        timeRange,
        alerts
      };
    },
    enabled: !!(labResults && patients),
  });

  return healthTrends;
}

function filterMetricsBySpecialty(
  labTrends: any[],
  detailedTrends: any[],
  specialty: Specialty,
  customMetricGroups: MetricGroup[]
) {
  // Implementation of specialty-specific metric filtering
  const specialtyMetrics = {
    cardiology: ["blood_pressure", "heart_rate", "cholesterol"],
    endocrinology: ["glucose", "insulin", "thyroid"],
    neurology: ["brain_activity", "reflexes", "nerve_conduction"],
    pediatrics: ["growth_rate", "development_markers", "vaccinations"],
    oncology: ["tumor_markers", "blood_count", "immune_response"],
    general: ["vitals", "basic_metabolic_panel", "complete_blood_count"]
  };

  const selectedMetrics = specialty === "general" 
    ? [...specialtyMetrics.general]
    : [...specialtyMetrics[specialty], ...specialtyMetrics.general];

  // Apply custom metric groupings if provided
  const customMetrics = customMetricGroups.reduce((acc, group) => {
    return [...acc, ...group.metrics];
  }, [] as string[]);

  return {
    labTrends: labTrends.filter(trend => 
      selectedMetrics.includes(trend.category) || customMetrics.includes(trend.category)
    ),
    detailedTrends: detailedTrends.filter(trend =>
      selectedMetrics.includes(trend.category) || customMetrics.includes(trend.category)
    )
  };
}

function calculateCriticalAlerts(metrics: any, customMetricGroups: MetricGroup[]) {
  const alerts = [];

  // Process each metric group and check against thresholds
  for (const group of customMetricGroups) {
    if (group.thresholds) {
      const groupMetrics = metrics.labTrends.filter((trend: any) =>
        group.metrics.includes(trend.category)
      );

      for (const metric of groupMetrics) {
        const latestValue = metric.trends[metric.trends.length - 1]?.value;
        if (latestValue > group.thresholds.critical) {
          alerts.push({
            metric: metric.category,
            value: latestValue,
            severity: "critical",
            group: group.name
          });
        } else if (latestValue > group.thresholds.warning) {
          alerts.push({
            metric: metric.category,
            value: latestValue,
            severity: "warning",
            group: group.name
          });
        }
      }
    }
  }

  return alerts;
}