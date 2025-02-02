import { sql } from "drizzle-orm";
import { date, integer, pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const specialties = pgTable("specialties", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
});

export const doctors = pgTable("doctors", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  specialtyId: integer("specialty_id").references(() => specialties.id),
  qualification: text("qualification"),
  experience: integer("experience"),
  availableDays: text("available_days").array(),
  startDate: date("start_date"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const patients = pgTable("patients", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"),
  status: text("status").default("active"),
  healthConditions: text("health_conditions").array(),
  medications: text("medications").array(),
  allergies: text("allergies").array(),
  chronicConditions: text("chronic_conditions").array(),
  surgicalHistory: text("surgical_history").array(),
  familyHistory: text("family_history").array(),
  vaccinationHistory: text("vaccination_history").array(),
  smokingStatus: text("smoking_status").default("never"),
  exerciseFrequency: text("exercise_frequency").default("never"),
  preferredCommunication: text("preferred_communication").default("email"),
  emergencyContact: text("emergency_contact"),
  medicalNotes: text("medical_notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const appointments = pgTable("appointments", {
  id: integer("id").primaryKey().notNull(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").references(() => doctors.id),
  date: timestamp("date").notNull(),
  status: text("status").default("scheduled"),
  notes: text("notes"),
  actualStartTime: timestamp("actual_start_time"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const symptomJournals = pgTable("symptom_journals", {
  id: integer("id").primaryKey().notNull(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  symptoms: text("symptoms").array(),
  severity: integer("severity").notNull(),
  mood: text("mood").notNull(),
  duration: text("duration"),
  notes: text("notes"),
  dateRecorded: timestamp("date_recorded").default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const symptomAnalysis = pgTable("symptom_analysis", {
  id: integer("id").primaryKey().notNull(),
  journalId: integer("journal_id").notNull().references(() => symptomJournals.id),
  analysis: text("analysis").notNull(),
  sentiment: text("sentiment"),
  suggestedActions: text("suggested_actions").array(),
  aiConfidence: numeric("ai_confidence"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const doctorsRelations = relations(doctors, ({ one }) => ({
  specialty: one(specialties, {
    fields: [doctors.specialtyId],
    references: [specialties.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
}));

export const symptomJournalsRelations = relations(symptomJournals, ({ one, many }) => ({
  patient: one(patients, {
    fields: [symptomJournals.patientId],
    references: [patients.id],
  }),
  analysis: many(symptomAnalysis),
}));

export const symptomAnalysisRelations = relations(symptomAnalysis, ({ one }) => ({
  journal: one(symptomJournals, {
    fields: [symptomAnalysis.journalId],
    references: [symptomJournals.id],
  }),
}));

export const insertSymptomJournalSchema = createInsertSchema(symptomJournals, {
  symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  severity: z.number().min(1).max(10),
  duration: z.string().optional(),
  notes: z.string().optional(),
});

export const insertSymptomAnalysisSchema = createInsertSchema(symptomAnalysis);

export const insertDoctorSchema = createInsertSchema(doctors, {
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  specialtyId: z.number().int().optional(),
  qualification: z.string().optional(),
  experience: z.number().int().min(0).optional(),
  availableDays: z.array(
    z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
  ).optional(),
  startDate: z.date().optional().nullable(),
});

export const insertPatientSchema = createInsertSchema(patients, {
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
  healthConditions: z.array(z.string()).optional().default([]),
  medications: z.array(z.string()).optional().default([]),
  allergies: z.array(z.string()).optional().default([]),
  chronicConditions: z.array(z.string()).optional().default([]),
  surgicalHistory: z.array(z.string()).optional().default([]),
  familyHistory: z.array(z.string()).optional().default([]),
  vaccinationHistory: z.array(z.string()).optional().default([]),
  smokingStatus: z.enum(["never", "former", "current"]).default("never"),
  exerciseFrequency: z.enum(["never", "occasional", "regular"]).default("never"),
  preferredCommunication: z.enum(["email", "phone", "sms"]).default("email"),
  emergencyContact: z.string().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),
});

export const insertAppointmentSchema = createInsertSchema(appointments);

export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type SelectDoctor = typeof doctors.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type SelectPatient = typeof patients.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type SelectAppointment = typeof appointments.$inferSelect;
export type InsertSymptomJournal = z.infer<typeof insertSymptomJournalSchema>;
export type SelectSymptomJournal = typeof symptomJournals.$inferSelect;
export type InsertSymptomAnalysis = z.infer<typeof insertSymptomAnalysisSchema>;
export type SelectSymptomAnalysis = typeof symptomAnalysis.$inferSelect;