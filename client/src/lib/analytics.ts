import { SelectAppointment, SelectPatient } from "@db/schema";
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
