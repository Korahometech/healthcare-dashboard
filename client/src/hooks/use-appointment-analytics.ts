import { useQuery } from "@tanstack/react-query";
import type { SelectAppointment } from "@db/schema";
import { startOfDay, endOfDay, differenceInMinutes, addDays, format } from "date-fns";

interface WaitTimeEstimate {
  timeSlot: string;
  estimatedWaitMinutes: number;
  confidence: number;
  factors: {
    dayOfWeek: number;
    timeOfDay: number;
    appointmentDensity: number;
  };
}

interface PeakHourPrediction {
  hour: number;
  predictedLoad: number;
  availableSlots: number;
  confidence: number;
  historicalData: {
    averageWaitTime: number;
    noShowRate: number;
  };
}

interface ScheduleOptimization {
  suggestedTimeSlots: Array<{
    startTime: string;
    endTime: string;
    probability: number;
    expectedWaitTime: number;
    suggestion: string;
  }>;
  expectedWaitTime: number;
  confidenceScore: number;
  alternativeSlots: Array<{
    time: string;
    score: number;
    reason: string;
  }>;
}

interface AppointmentPattern {
  dayOfWeek: number;
  timeSlot: string;
  averageWaitTime: number;
  noShowProbability: number;
  historicalLoad: number;
}

export function useAppointmentAnalytics(date?: Date, specialtyId?: number) {
  return useQuery<{
    waitTimeEstimates: WaitTimeEstimate[];
    peakHours: PeakHourPrediction[];
    optimizedSchedule: ScheduleOptimization;
    patterns: AppointmentPattern[];
  }>({
    queryKey: ["/api/appointments/analytics", date?.toISOString(), specialtyId],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (date) {
        searchParams.set("date", date.toISOString());
      }
      if (specialtyId) {
        searchParams.set("specialtyId", specialtyId.toString());
      }

      const response = await fetch(
        `/api/appointments/analytics?${searchParams.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch appointment analytics");
      }

      return response.json();
    },
    enabled: true,
  });
}

export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 17,
  intervalMinutes: number = 30
): string[] {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      slots.push(
        `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      );
    }
  }
  return slots;
}

export function calculateWaitTime(appointments: SelectAppointment[], date: Date): number {
  if (!appointments.length) return 0;

  const dayAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date);
    return startOfDay(appointmentDate).getTime() === startOfDay(date).getTime();
  });

  const waitTimes = dayAppointments.map(appointment => {
    const scheduledTime = new Date(appointment.date);
    const estimatedWaitTime = calculateEstimatedWaitTimeForAppointment(
      appointment,
      dayAppointments
    );
    return estimatedWaitTime;
  });

  return waitTimes.length
    ? Math.round(waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length)
    : 0;
}

function calculateEstimatedWaitTimeForAppointment(
  appointment: SelectAppointment,
  dayAppointments: SelectAppointment[]
): number {
  const appointmentTime = new Date(appointment.date);
  const precedingAppointments = dayAppointments.filter(a => 
    new Date(a.date) < appointmentTime
  );

  // Base wait time calculation
  let estimatedWait = precedingAppointments.length * 5; // 5 minutes average delay per preceding appointment

  // Factor in time of day
  const hour = appointmentTime.getHours();
  if (hour >= 11 && hour <= 14) { // Lunch rush
    estimatedWait += 10;
  }

  // Factor in day of week
  const dayOfWeek = appointmentTime.getDay();
  if (dayOfWeek === 1 || dayOfWeek === 5) { // Mondays and Fridays tend to be busier
    estimatedWait += 5;
  }

  return Math.max(0, estimatedWait);
}

export function predictOptimalSlots(
  existingAppointments: SelectAppointment[],
  targetDate: Date,
  duration: number = 30
): ScheduleOptimization {
  const suggestedSlots: ScheduleOptimization['suggestedTimeSlots'] = [];
  const alternativeSlots: ScheduleOptimization['alternativeSlots'] = [];

  const timeSlots = generateTimeSlots();
  const dayOfWeek = targetDate.getDay();

  timeSlots.forEach(slot => {
    const [hour, minute] = slot.split(':').map(Number);
    const slotTime = new Date(targetDate);
    slotTime.setHours(hour, minute);

    const conflictingAppointments = existingAppointments.filter(app => {
      const appTime = new Date(app.date);
      return Math.abs(appTime.getTime() - slotTime.getTime()) < duration * 60000;
    });

    const estimatedWait = calculateEstimatedWaitTimeForAppointment(
      { date: slotTime } as SelectAppointment,
      existingAppointments
    );

    const score = calculateSlotScore(slotTime, conflictingAppointments.length, estimatedWait);

    if (score > 0.7) {
      suggestedSlots.push({
        startTime: format(slotTime, 'HH:mm'),
        endTime: format(new Date(slotTime.getTime() + duration * 60000), 'HH:mm'),
        probability: score,
        expectedWaitTime: estimatedWait,
        suggestion: getSuggestionText(score, estimatedWait)
      });
    } else {
      alternativeSlots.push({
        time: format(slotTime, 'HH:mm'),
        score,
        reason: getReasonText(score, estimatedWait, conflictingAppointments.length)
      });
    }
  });

  return {
    suggestedTimeSlots: suggestedSlots.sort((a, b) => b.probability - a.probability),
    expectedWaitTime: Math.min(...suggestedSlots.map(s => s.expectedWaitTime)),
    confidenceScore: calculateOverallConfidence(suggestedSlots),
    alternativeSlots: alternativeSlots.sort((a, b) => b.score - a.score)
  };
}

function calculateSlotScore(
  time: Date,
  conflictCount: number,
  estimatedWait: number
): number {
  let score = 1.0;

  // Penalize for conflicts
  score -= conflictCount * 0.2;

  // Penalize for high wait times
  score -= (estimatedWait / 60) * 0.1;

  // Prefer mid-morning and mid-afternoon slots
  const hour = time.getHours();
  if (hour >= 10 && hour <= 11) score += 0.1;
  if (hour >= 14 && hour <= 15) score += 0.1;

  // Avoid lunch hour
  if (hour >= 12 && hour <= 13) score -= 0.1;

  return Math.max(0, Math.min(1, score));
}

function calculateOverallConfidence(slots: ScheduleOptimization['suggestedTimeSlots']): number {
  if (!slots.length) return 0;
  return slots.reduce((sum, slot) => sum + slot.probability, 0) / slots.length;
}

function getSuggestionText(score: number, waitTime: number): string {
  if (score > 0.8) return "Highly recommended slot with minimal wait time";
  if (score > 0.6) return `Moderate wait time expected (${waitTime} minutes)`;
  return "May experience longer wait times";
}

function getReasonText(score: number, waitTime: number, conflicts: number): string {
  const reasons = [];
  if (waitTime > 30) reasons.push("High expected wait time");
  if (conflicts > 0) reasons.push("Schedule conflicts");
  if (score < 0.3) reasons.push("Peak hour");
  return reasons.join(", ") || "Generally less optimal time slot";
}