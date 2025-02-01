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

type TimeRange = "daily" | "weekly" | "monthly" | "1M" | "3M" | "6M" | "1Y" | "ALL";

// Add new appointment optimization functions
export function calculateAppointmentOptimization(
  appointments: SelectAppointment[]
): {
  peakHours: { hour: number; count: number }[];
  noShowRate: { date: string; rate: number }[];
  waitTimes: { date: string; avgWaitMinutes: number }[];
  schedulingEfficiency: number;
} {
  // Calculate peak appointment hours
  const hourCounts = appointments.reduce((acc, appointment) => {
    const hour = new Date(appointment.date).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count);

  // Calculate no-show rates by date
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const date = format(new Date(appointment.date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { total: 0, noShows: 0 };
    }
    acc[date].total++;
    if (appointment.status === 'no-show') {
      acc[date].noShows++;
    }
    return acc;
  }, {} as Record<string, { total: number; noShows: number }>);

  const noShowRate = Object.entries(appointmentsByDate)
    .map(([date, { total, noShows }]) => ({
      date,
      rate: (noShows / total) * 100,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate average wait times
  const waitTimes = appointments
    .reduce((acc, appointment) => {
      const date = format(new Date(appointment.date), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { total: 0, count: 0 };
      }
      if (appointment.actualStartTime) {
        const scheduledTime = new Date(appointment.date);
        const actualTime = new Date(appointment.actualStartTime);
        const waitMinutes = (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
        acc[date].total += waitMinutes;
        acc[date].count++;
      }
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

  const avgWaitTimes = Object.entries(waitTimes)
    .map(([date, { total, count }]) => ({
      date,
      avgWaitMinutes: count > 0 ? total / count : 0,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate overall scheduling efficiency
  const totalAppointments = appointments.length;
  const completedOnTime = appointments.filter(
    a => a.status === 'completed' && (!a.actualStartTime || 
    new Date(a.actualStartTime).getTime() - new Date(a.date).getTime() <= 15 * 60 * 1000) // 15 minutes threshold
  ).length;

  const schedulingEfficiency = totalAppointments > 0 
    ? (completedOnTime / totalAppointments) * 100 
    : 0;

  return {
    peakHours,
    noShowRate,
    waitTimes: avgWaitTimes,
    schedulingEfficiency,
  };
}

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
  labResults: SelectLabResult[],
  timeRange: TimeRange = "6M"
): { testName: string; trends: { date: string; value: number; confidence: number }[] }[] {
  const startDate = getStartDateForRange(timeRange);

  const filteredResults = labResults.filter(result => 
    new Date(result.testDate) >= startDate
  );

  const resultsByTest = filteredResults.reduce((acc, result) => {
    if (!acc[result.testName]) {
      acc[result.testName] = [];
    }
    // Add confidence level based on test type and reference ranges
    const confidence = calculateConfidenceLevel(result);
    acc[result.testName].push({
      date: format(new Date(result.testDate), 'yyyy-MM-dd'),
      value: result.value,
      confidence
    });
    return acc;
  }, {} as Record<string, { date: string; value: number; confidence: number }[]>);

  return Object.entries(resultsByTest)
    .map(([testName, data]) => ({
      testName,
      trends: data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }));
}

function calculateConfidenceLevel(result: SelectLabResult): number {
  if (!result.referenceMin || !result.referenceMax) return 1;

  const range = result.referenceMax - result.referenceMin;
  const midpoint = (result.referenceMax + result.referenceMin) / 2;
  const deviation = Math.abs(result.value - midpoint);

  // Return confidence level between 0 and 1
  return Math.max(0, Math.min(1, 1 - (deviation / range)));
}

function getStartDateForRange(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case "1M":
      return subMonths(now, 1);
    case "3M":
      return subMonths(now, 3);
    case "6M":
      return subMonths(now, 6);
    case "1Y":
      return subMonths(now, 12);
    case "ALL":
      return new Date(0); // Beginning of time
    default:
      return subMonths(now, 6);
  }
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

export function calculateMetricCorrelation(
  patients: SelectPatient[],
  labResults: SelectLabResult[]
): { metric1: string; metric2: string; correlation: number }[] {
  const correlations: { metric1: string; metric2: string; correlation: number }[] = [];

  // Calculate correlations between different health metrics
  const metrics = [
    { name: 'BMI', getValue: (p: SelectPatient) => 
      p.height && p.weight ? p.weight / ((p.height / 100) ** 2) : null },
    { name: 'Blood Pressure', getValue: (p: SelectPatient, r: SelectLabResult[]) => 
      r.find(x => x.testName === 'Blood Pressure')?.value },
    { name: 'Cholesterol', getValue: (p: SelectPatient, r: SelectLabResult[]) => 
      r.find(x => x.testName === 'Cholesterol')?.value },
  ];

  // Calculate correlations between each pair of metrics
  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const data = patients.map(patient => {
        const patientResults = labResults.filter(r => r.patientId === patient.id);
        return {
          value1: metrics[i].getValue(patient, patientResults),
          value2: metrics[j].getValue(patient, patientResults)
        };
      }).filter(d => d.value1 != null && d.value2 != null);

      if (data.length > 0) {
        const correlation = calculatePearsonCorrelation(
          data.map(d => d.value1!),
          data.map(d => d.value2!)
        );

        correlations.push({
          metric1: metrics[i].name,
          metric2: metrics[j].name,
          correlation
        });
      }
    }
  }

  return correlations;
}

export function calculateHealthTrends(
  patients: SelectPatient[],
  labResults: SelectLabResult[],
  timeRange: TimeRange = "6M"
): { 
  category: string;
  trends: { 
    date: string; 
    average: number; 
    min: number; 
    max: number;
    confidenceInterval: { lower: number; upper: number };
  }[] 
}[] {
  const startDate = getStartDateForRange(timeRange);
  const filteredResults = labResults.filter(result => 
    new Date(result.testDate) >= startDate
  );

  const testCategories = Array.from(new Set(filteredResults.map(r => r.testName)));

  return testCategories.map(category => {
    const categoryResults = filteredResults.filter(r => r.testName === category);
    const dateGroups = categoryResults.reduce((acc, result) => {
      const date = format(new Date(result.testDate), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(result.value);
      return acc;
    }, {} as Record<string, number[]>);

    const trends = Object.entries(dateGroups).map(([date, values]) => {
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const standardDeviation = calculateStandardDeviation(values);

      return {
        date,
        average,
        min: Math.min(...values),
        max: Math.max(...values),
        confidenceInterval: {
          lower: average - (1.96 * standardDeviation),
          upper: average + (1.96 * standardDeviation)
        }
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      category,
      trends
    };
  });
}

function calculateStandardDeviation(values: number[]): number {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const variance = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}


export function predictHealthTrends(
  labResults: SelectLabResult[]
): { testName: string; predictions: { date: string; value: number; }[] }[] {
  const testCategories = Array.from(new Set(labResults.map(r => r.testName)));

  return testCategories.map(testName => {
    const categoryResults = labResults
      .filter(r => r.testName === testName)
      .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());

    if (categoryResults.length < 2) return { testName, predictions: [] };

    // Simple linear regression for prediction
    const values = categoryResults.map(r => r.value);
    const timestamps = categoryResults.map(r => new Date(r.testDate).getTime());
    const { slope, intercept } = calculateLinearRegression(timestamps, values);

    // Predict next 3 months
    const lastDate = new Date(categoryResults[categoryResults.length - 1].testDate);
    const predictions = Array.from({ length: 3 }).map((_, i) => {
      const predictedDate = new Date(lastDate);
      predictedDate.setMonth(predictedDate.getMonth() + i + 1);
      const predictedValue = slope * predictedDate.getTime() + intercept;
      return {
        date: format(predictedDate, 'yyyy-MM-dd'),
        value: Math.round(predictedValue * 100) / 100
      };
    });

    return {
      testName,
      predictions
    };
  });
}

// Helper functions for calculations
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sum1 = x.reduce((a, b) => a + b, 0);
  const sum2 = y.reduce((a, b) => a + b, 0);
  const sum1Sq = x.reduce((a, b) => a + b * b, 0);
  const sum2Sq = y.reduce((a, b) => a + b * b, 0);
  const pSum = x.reduce((a, b, i) => a + b * y[i], 0);

  const num = pSum - (sum1 * sum2 / n);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

  return den === 0 ? 0 : Math.round((num / den) * 1000) / 1000;
}

function calculateLinearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumXX = x.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}