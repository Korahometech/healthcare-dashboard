import { SelectAppointment, SelectPatient, SelectLabResult } from "@db/schema";
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
} from "date-fns";

type TimeRange = "daily" | "weekly" | "monthly";

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

export function analyzeLabResultsTrends(
  labResults: SelectLabResult[]
): { testName: string; trends: { date: string; value: number }[] }[] {
  const resultsByTest = labResults.reduce((acc, result) => {
    if (!acc[result.testName]) {
      acc[result.testName] = [];
    }
    acc[result.testName].push({
      date: format(new Date(result.testDate), 'yyyy-MM-dd'),
      value: result.value,
    });
    return acc;
  }, {} as Record<string, { date: string; value: number }[]>);

  return Object.entries(resultsByTest)
    .map(([testName, data]) => ({
      testName,
      trends: data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }));
}

export function calculateHealthRiskFactors(
  patients: SelectPatient[],
  labResults: SelectLabResult[]
): { riskFactor: string; patientCount: number }[] {
  const riskFactors: Record<string, number> = {};

  patients.forEach(patient => {
    // Age-based risk factors
    const age = patient.dateOfBirth ?
      differenceInYears(new Date(), new Date(patient.dateOfBirth)) : 0;
    if (age > 60) riskFactors['Age > 60'] = (riskFactors['Age > 60'] || 0) + 1;

    // Health conditions
    patient.healthConditions?.forEach(condition => {
      riskFactors[condition] = (riskFactors[condition] || 0) + 1;
    });

    // Abnormal lab results
    const patientLabResults = labResults.filter(result => result.patientId === patient.id);
    patientLabResults.forEach(result => {
      if (result.referenceMin !== null && result.referenceMax !== null) {
        if (result.value < result.referenceMin || result.value > result.referenceMax) {
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
    .sort((a, b) => b.patientCount - b.patientCount);
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