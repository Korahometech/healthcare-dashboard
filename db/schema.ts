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


export const carePlans = pgTable("care_plans", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const treatments = pgTable("treatments", {
  id: serial("id").primaryKey(),
  carePlanId: integer("care_plan_id").references(() => carePlans.id),
  name: text("name").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(), // daily, weekly, monthly
  duration: integer("duration"), // in minutes
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  carePlanId: integer("care_plan_id").references(() => carePlans.id),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  instructions: text("instructions"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  reminderEnabled: boolean("reminder_enabled").default(true),
  reminderTime: text("reminder_time").array(), // Array of times for reminders
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const healthGoals = pgTable("health_goals", {
  id: serial("id").primaryKey(),
  carePlanId: integer("care_plan_id").references(() => carePlans.id),
  name: text("name").notNull(),
  description: text("description"),
  targetValue: integer("target_value"),
  unit: text("unit"),
  deadline: date("deadline"),
  status: text("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const progressEntries = pgTable("progress_entries", {
  id: serial("id").primaryKey(),
  healthGoalId: integer("health_goal_id").references(() => healthGoals.id),
  value: integer("value").notNull(),
  notes: text("notes"),
  entryDate: timestamp("entry_date").notNull().defaultNow(),
});

// Relations
export const carePlansRelations = relations(carePlans, ({ one, many }) => ({
  patient: one(patients, {
    fields: [carePlans.patientId],
    references: [patients.id],
  }),
  treatments: many(treatments),
  medications: many(medications),
  healthGoals: many(healthGoals),
}));

export const healthGoalsRelations = relations(healthGoals, ({ one, many }) => ({
  carePlan: one(carePlans, {
    fields: [healthGoals.carePlanId],
    references: [carePlans.id],
  }),
  progressEntries: many(progressEntries),
}));

// Schemas
export const insertCarePlanSchema = createInsertSchema(carePlans);
export const selectCarePlanSchema = createSelectSchema(carePlans);
export type InsertCarePlan = z.infer<typeof insertCarePlanSchema>;
export type SelectCarePlan = z.infer<typeof selectCarePlanSchema>;

export const insertTreatmentSchema = createInsertSchema(treatments);
export const selectTreatmentSchema = createSelectSchema(treatments);
export type InsertTreatment = z.infer<typeof insertTreatmentSchema>;
export type SelectTreatment = z.infer<typeof selectTreatmentSchema>;

export const insertMedicationSchema = createInsertSchema(medications);
export const selectMedicationSchema = createSelectSchema(medications);
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type SelectMedication = z.infer<typeof selectMedicationSchema>;

export const insertHealthGoalSchema = createInsertSchema(healthGoals);
export const selectHealthGoalSchema = createSelectSchema(healthGoals);
export type InsertHealthGoal = z.infer<typeof insertHealthGoalSchema>;
export type SelectHealthGoal = z.infer<typeof selectHealthGoalSchema>;

export const insertProgressEntrySchema = createInsertSchema(progressEntries);
export const selectProgressEntrySchema = createSelectSchema(progressEntries);
export type InsertProgressEntry = z.infer<typeof insertProgressEntrySchema>;
export type SelectProgressEntry = z.infer<typeof selectProgressEntrySchema>;