import { useQuery } from "@tanstack/react-query";
import { useLabResults } from "./use-lab-results";
import { usePrescriptions } from "./use-prescriptions";
import { useMedicalHistory } from "./use-medical-history";
import { usePatients } from "./use-patients";
import {
  analyzeTreatmentEffectiveness,
  analyzeLabResultsTrends,
  analyzeHealthConditionsProgress,
  calculateHealthRiskFactors,
} from "@/lib/analytics";

export function useHealthTrends(patientId?: number) {
  const { results: labResults } = useLabResults(patientId || 0);
  const { prescriptions } = usePrescriptions(patientId || 0);
  const { history: medicalHistory } = useMedicalHistory(patientId || 0);
  const { patients } = usePatients();

  const healthTrends = useQuery({
    queryKey: ["health-trends", patientId],
    queryFn: () => {
      const treatmentEffectiveness = analyzeTreatmentEffectiveness(prescriptions, medicalHistory);
      const labTrends = analyzeLabResultsTrends(labResults);
      const conditionsProgress = analyzeHealthConditionsProgress(medicalHistory);
      const riskFactors = calculateHealthRiskFactors(patients, labResults);

      return {
        treatmentEffectiveness,
        labTrends,
        conditionsProgress,
        riskFactors,
      };
    },
    enabled: !!(labResults && prescriptions && medicalHistory && patients),
  });

  return healthTrends;
}
