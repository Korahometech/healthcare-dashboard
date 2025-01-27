import { SelectAppointment, SelectPatient, SelectLabResult, SelectPrescription, SelectMedicalHistory } from "@db/schema";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  subMonths,
  format,
  differenceInYears,
  parseISO,
} from "date-fns";

type TimeRange = "daily" | "weekly" | "monthly";
type AppointmentStatus = "scheduled" | "confirmed" | "cancelled";

export function calculateCompletionRate(appointments: SelectAppointment[]): number {
  const completed = appointments.filter((a) => a.status === "confirmed").length;
  return appointments.length > 0
    ? Math.round((completed / appointments.length) * 100)
    : 0;
}

export function calculateCancellationRate(appointments: SelectAppointment[]): number {
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  return appointments.length > 0
    ? Math.round((cancelled / appointments.length) * 100)
    : 0;
}

export function getAppointmentsByTimeRange(
  appointments: SelectAppointment[],
  range: TimeRange,
  months: number = 6
): { name: string; count: number }[] {
  const now = new Date();
  const startDate = subMonths(now, months);
  
  const intervals = {
    daily: eachDayOfInterval({ start: startDate, end: now }),
    weekly: eachWeekOfInterval({ start: startDate, end: now }),
    monthly: eachMonthOfInterval({ start: startDate, end: now }),
  };

  const formatPatterns = {
    daily: "MMM d",
    weekly: "MMM d",
    monthly: "MMM yyyy",
  };

  return intervals[range].map((date) => {
    let start: Date;
    let end: Date;

    switch (range) {
      case "daily":
        start = startOfDay(date);
        end = endOfDay(date);
        break;
      case "weekly":
        start = startOfWeek(date);
        end = endOfWeek(date);
        break;
      case "monthly":
        start = startOfMonth(date);
        end = endOfMonth(date);
        break;
    }

    const count = appointments.filter((appointment) =>
      isWithinInterval(new Date(appointment.date), { start, end })
    ).length;

    return {
      name: format(date, formatPatterns[range]),
      count,
    };
  });
}

export function getAppointmentStatusDistribution(
  appointments: SelectAppointment[],
  timeRange?: { start: Date; end: Date }
): Record<AppointmentStatus, number> {
  const filteredAppointments = timeRange
    ? appointments.filter((a) =>
        isWithinInterval(new Date(a.date), timeRange)
      )
    : appointments;

  return {
    scheduled: filteredAppointments.filter((a) => a.status === "scheduled").length,
    confirmed: filteredAppointments.filter((a) => a.status === "confirmed").length,
    cancelled: filteredAppointments.filter((a) => a.status === "cancelled").length,
  };
}

export function getPatientVisitFrequency(
  appointments: SelectAppointment[]
): { visits: number; count: number }[] {
  const patientVisits = appointments.reduce((acc, appointment) => {
    const patientId = appointment.patientId;
    acc[patientId] = (acc[patientId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const frequencyCount = Object.values(patientVisits).reduce((acc, visits) => {
    acc[visits] = (acc[visits] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return Object.entries(frequencyCount)
    .map(([visits, count]) => ({
      visits: parseInt(visits),
      count,
    }))
    .sort((a, b) => a.visits - b.visits);
}

export function calculatePatientRetentionRate(
  appointments: SelectAppointment[]
): number {
  const patientVisits = appointments.reduce((acc, appointment) => {
    const patientId = appointment.patientId;
    acc[patientId] = (acc[patientId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const returningPatients = Object.values(patientVisits).filter(
    (visits) => visits > 1
  ).length;
  const totalPatients = Object.keys(patientVisits).length;

  return totalPatients > 0
    ? Math.round((returningPatients / totalPatients) * 100)
    : 0;
}

export function calculateAgeDistribution(patients: SelectPatient[]): { age: string; count: number }[] {
  const ageGroups = {
    '0-17': 0,
    '18-30': 0,
    '31-45': 0,
    '46-60': 0,
    '61+': 0
  };

  patients.forEach(patient => {
    if (!patient.dateOfBirth) return;

    const age = differenceInYears(new Date(), new Date(patient.dateOfBirth));

    if (age <= 17) ageGroups['0-17']++;
    else if (age <= 30) ageGroups['18-30']++;
    else if (age <= 45) ageGroups['31-45']++;
    else if (age <= 60) ageGroups['46-60']++;
    else ageGroups['61+']++;
  });

  return Object.entries(ageGroups).map(([age, count]) => ({ age, count }));
}

export function calculateGenderDistribution(patients: SelectPatient[]): { gender: string; count: number }[] {
  const distribution = patients.reduce((acc, patient) => {
    if (patient.gender) {
      acc[patient.gender] = (acc[patient.gender] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(distribution).map(([gender, count]) => ({ gender, count }));
}

export function calculateGeographicDistribution(patients: SelectPatient[]): { region: string; count: number }[] {
  const distribution = patients.reduce((acc, patient) => {
    if (patient.region) {
      acc[patient.region] = (acc[patient.region] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(distribution)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);
}

export function calculateHealthConditionsDistribution(patients: SelectPatient[]): { condition: string; count: number }[] {
  const distribution: Record<string, number> = {};

  patients.forEach(patient => {
    if (patient.healthConditions) {
      patient.healthConditions.forEach(condition => {
        distribution[condition] = (distribution[condition] || 0) + 1;
      });
    }
  });

  return Object.entries(distribution)
    .map(([condition, count]) => ({ condition, count }))
    .sort((a, b) => b.count - a.count);
}

export function analyzeTreatmentEffectiveness(
  prescriptions: SelectPrescription[],
  medicalHistory: SelectMedicalHistory[]
): { medication: string; effectiveness: number }[] {
  const medicationOutcomes: Record<string, { success: number; total: number }> = {};

  prescriptions.forEach(prescription => {
    const relatedEvents = medicalHistory.filter(
      event => 
        event.eventDate >= new Date(prescription.startDate) &&
        (!prescription.endDate || event.eventDate <= new Date(prescription.endDate))
    );

    const successfulOutcomes = relatedEvents.filter(
      event => event.outcome === 'improved' || event.outcome === 'resolved'
    ).length;

    medicationOutcomes[prescription.medication] = medicationOutcomes[prescription.medication] || { success: 0, total: 0 };
    medicationOutcomes[prescription.medication].success += successfulOutcomes;
    medicationOutcomes[prescription.medication].total += relatedEvents.length;
  });

  return Object.entries(medicationOutcomes)
    .map(([medication, { success, total }]) => ({
      medication,
      effectiveness: total > 0 ? (success / total) * 100 : 0,
    }))
    .sort((a, b) => b.effectiveness - a.effectiveness);
}

export function analyzeLabResultsTrends(
  labResults: SelectLabResult[]
): { testName: string; trends: { date: string; value: number }[] }[] {
  const resultsByTest = labResults.reduce((acc, result) => {
    if (!acc[result.testName]) {
      acc[result.testName] = [];
    }
    // Assuming results contains a 'value' field in the JSON
    const value = typeof result.results === 'object' ? (result.results as any).value : 0;
    acc[result.testName].push({
      date: format(new Date(result.testDate), 'yyyy-MM-dd'),
      value,
    });
    return acc;
  }, {} as Record<string, { date: string; value: number }[]>);

  return Object.entries(resultsByTest)
    .map(([testName, data]) => ({
      testName,
      trends: data.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()),
    }));
}

export function analyzeHealthConditionsProgress(
  medicalHistory: SelectMedicalHistory[]
): { condition: string; progress: { date: string; severity: number }[] }[] {
  const progressByCondition = medicalHistory.reduce((acc, event) => {
    if (!acc[event.eventType]) {
      acc[event.eventType] = [];
    }
    // Convert severity to numeric value (e.g., 'mild' = 1, 'moderate' = 2, 'severe' = 3)
    const severityMap: Record<string, number> = {
      mild: 1,
      moderate: 2,
      severe: 3,
    };
    acc[event.eventType].push({
      date: format(new Date(event.eventDate), 'yyyy-MM-dd'),
      severity: severityMap[event.severity?.toLowerCase() || ''] || 0,
    });
    return acc;
  }, {} as Record<string, { date: string; severity: number }[]>);

  return Object.entries(progressByCondition)
    .map(([condition, data]) => ({
      condition,
      progress: data.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()),
    }));
}

export function calculateHealthRiskFactors(
  patients: SelectPatient[],
  labResults: SelectLabResult[]
): { riskFactor: string; patientCount: number }[] {
  const riskFactors: Record<string, number> = {};

  patients.forEach(patient => {
    // Age-based risk factors
    const age = differenceInYears(new Date(), new Date(patient.dateOfBirth || Date.now()));
    if (age > 60) riskFactors['Age > 60'] = (riskFactors['Age > 60'] || 0) + 1;

    // Health conditions
    patient.healthConditions?.forEach(condition => {
      riskFactors[condition] = (riskFactors[condition] || 0) + 1;
    });

    // Abnormal lab results
    const patientLabResults = labResults.filter(result => result.patientId === patient.id);
    patientLabResults.forEach(result => {
      const referenceRange = result.referenceRange as { min?: number; max?: number } | null;
      const value = (result.results as any).value;

      if (referenceRange && value) {
        if (value < (referenceRange.min || 0) || value > (referenceRange.max || 0)) {
          const riskFactor = `Abnormal ${result.testName}`;
          riskFactors[riskFactor] = (riskFactors[riskFactor] || 0) + 1;
        }
      }
    });
  });

  return Object.entries(riskFactors)
    .map(([riskFactor, patientCount]) => ({
      riskFactor,
      patientCount,
    }))
    .sort((a, b) => b.patientCount - a.patientCount);
}

export function calculateBMIDistribution(patients: SelectPatient[]): { category: string; count: number }[] {
  const categories = {
    'Underweight': 0,
    'Normal': 0,
    'Overweight': 0,
    'Obese': 0
  };

  patients.forEach(patient => {
    if (patient.height && patient.weight) {
      const heightInMeters = patient.height / 100;
      const bmi = patient.weight / (heightInMeters * heightInMeters);

      if (bmi < 18.5) categories['Underweight']++;
      else if (bmi < 25) categories['Normal']++;
      else if (bmi < 30) categories['Overweight']++;
      else categories['Obese']++;
    }
  });

  return Object.entries(categories)
    .map(([category, count]) => ({ category, count }));
}

export function analyzeLifestyleImpact(
  patients: SelectPatient[]
): { factor: string; healthConditionCount: number }[] {
  const lifestyleImpact: Record<string, number> = {};

  patients.forEach(patient => {
    if (patient.smokingStatus === 'current' || patient.smokingStatus === 'former') {
      lifestyleImpact['Smoking'] = (lifestyleImpact['Smoking'] || 0) + 
        (patient.healthConditions?.length || 0);
    }

    if (patient.exerciseFrequency === 'rarely' || patient.exerciseFrequency === 'never') {
      lifestyleImpact['Sedentary Lifestyle'] = (lifestyleImpact['Sedentary Lifestyle'] || 0) + 
        (patient.healthConditions?.length || 0);
    }
  });

  return Object.entries(lifestyleImpact)
    .map(([factor, count]) => ({
      factor,
      healthConditionCount: count,
    }))
    .sort((a, b) => b.healthConditionCount - a.healthConditionCount);
}

export function analyzeFamilyHistoryPatterns(
  patients: SelectPatient[]
): { condition: string; count: number }[] {
  const familyConditions: Record<string, number> = {};

  patients.forEach(patient => {
    if (patient.familyHistory) {
      const history = patient.familyHistory as Record<string, string[]>;
      Object.values(history).flat().forEach(condition => {
        familyConditions[condition] = (familyConditions[condition] || 0) + 1;
      });
    }
  });

  return Object.entries(familyConditions)
    .map(([condition, count]) => ({ condition, count }))
    .sort((a, b) => b.count - a.count);
}