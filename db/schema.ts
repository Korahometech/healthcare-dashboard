import { pgTable, text, serial, integer, boolean, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),

  // Emergency Contact
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelation: text("emergency_contact_relation"),

  // Insurance Information
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: text("insurance_policy_number"),
  insuranceGroupNumber: text("insurance_group_number"),

  // Primary Care Information
  primaryPhysicianName: text("primary_physician_name"),
  primaryPhysicianContact: text("primary_physician_contact"),

  // Essential health information
  bloodType: text("blood_type"),
  height: integer("height"),
  weight: integer("weight"),
  allergies: text("allergies").array(),

  // Medical History
  chronicConditions: text("chronic_conditions").array(),
  surgicalHistory: jsonb("surgical_history"),
  familyHistory: jsonb("family_history"),
  vaccinationHistory: jsonb("vaccination_history"),

  // Basic health indicators
  healthConditions: text("health_conditions").array(),
  medications: text("medications").array(),

  // Simple lifestyle indicators
  smokingStatus: text("smoking_status"),
  exerciseFrequency: text("exercise_frequency"),

  // Preferences
  preferredPharmacy: text("preferred_pharmacy"),
  preferredCommunication: text("preferred_communication"),
  languagePreference: text("language_preference"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Create patient schemas with validation
export const insertPatientSchema = createInsertSchema(patients).extend({
  bloodType: z.string().nullable().optional(),
  healthConditions: z.array(z.string()).nullable().optional(),
  medications: z.array(z.string()).nullable().optional(),
  allergies: z.array(z.string()).nullable().optional(),
  chronicConditions: z.array(z.string()).nullable().optional(),
  surgicalHistory: z.record(z.string(), z.any()).nullable().optional(),
  familyHistory: z.record(z.string(), z.any()).nullable().optional(),
  vaccinationHistory: z.record(z.string(), z.any()).nullable().optional(),
  smokingStatus: z.enum(['never', 'former', 'current']).nullable().optional(),
  exerciseFrequency: z.enum(['never', 'rarely', 'moderate', 'regular']).nullable().optional(),
  preferredCommunication: z.enum(['email', 'phone', 'sms']).nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  weight: z.number().int().positive().nullable().optional(),
});

export const selectPatientSchema = createSelectSchema(patients);

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const labResults = pgTable("lab_results", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  testName: text("test_name").notNull(),
  testDate: timestamp("test_date").notNull(),
  value: integer("value").notNull(),
  unit: text("unit").notNull(),
  referenceMin: integer("reference_min"),
  referenceMax: integer("reference_max"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teleconsultations = pgTable("teleconsultations", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  meetingUrl: text("meeting_url").notNull(),
  status: text("status").notNull().default("scheduled"),
  duration: integer("duration").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  labResults: many(labResults),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  teleconsultation: one(teleconsultations, {
    fields: [appointments.id],
    references: [teleconsultations.appointmentId],
  }),
}));

export const labResultsRelations = relations(labResults, ({ one }) => ({
  patient: one(patients, {
    fields: [labResults.patientId],
    references: [patients.id],
  }),
}));

// Type exports
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

export const insertAppointmentSchema = createInsertSchema(appointments);
export const selectAppointmentSchema = createSelectSchema(appointments);
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type SelectAppointment = z.infer<typeof selectAppointmentSchema>;

export const insertLabResultSchema = createInsertSchema(labResults);
export const selectLabResultSchema = createSelectSchema(labResults);
export type InsertLabResult = z.infer<typeof insertLabResultSchema>;
export type SelectLabResult = z.infer<typeof selectLabResultSchema>;

export const insertTeleconsultationSchema = createInsertSchema(teleconsultations);
export const selectTeleconsultationSchema = createSelectSchema(teleconsultations);
export type InsertTeleconsultation = z.infer<typeof insertTeleconsultationSchema>;
export type SelectTeleconsultation = z.infer<typeof selectTeleconsultationSchema>;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type SelectPatient = z.infer<typeof selectPatientSchema>;