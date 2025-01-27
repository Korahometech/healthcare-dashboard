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
  city: text("city"),
  region: text("region"),
  bloodType: text("blood_type"),
  allergies: text("allergies").array(),
  healthConditions: text("health_conditions").array(),
  medications: text("medications").array(),
  chronicConditions: text("chronic_conditions").array(),
  smokingStatus: text("smoking_status"),
  exerciseFrequency: text("exercise_frequency"),
  occupation: text("occupation"),
  familyHistory: jsonb("family_history"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelation: text("emergency_contact_relation"),
  height: integer("height"),
  weight: integer("weight"),
  insuranceProvider: text("insurance_provider"),
  insuranceNumber: text("insurance_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Create base schemas
export const insertPatientSchema = createInsertSchema(patients).extend({
  bloodType: z.string().nullable().optional(),
  allergies: z.array(z.string()).nullable().optional(),
  healthConditions: z.array(z.string()).nullable().optional(),
  medications: z.array(z.string()).nullable().optional(),
  chronicConditions: z.array(z.string()).nullable().optional(),
  smokingStatus: z.string().nullable().optional(),
  exerciseFrequency: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  familyHistory: z.record(z.array(z.string())).nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  emergencyContactRelation: z.string().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  weight: z.number().int().positive().nullable().optional(),
  insuranceProvider: z.string().nullable().optional(),
  insuranceNumber: z.string().nullable().optional(),
});

export const selectPatientSchema = createSelectSchema(patients).extend({
  bloodType: z.string().nullable().optional(),
  allergies: z.array(z.string()).nullable().optional(),
  healthConditions: z.array(z.string()).nullable().optional(),
  medications: z.array(z.string()).nullable().optional(),
  chronicConditions: z.array(z.string()).nullable().optional(),
  smokingStatus: z.string().nullable().optional(),
  exerciseFrequency: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  familyHistory: z.record(z.array(z.string())).nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  emergencyContactRelation: z.string().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  weight: z.number().int().positive().nullable().optional(),
  insuranceProvider: z.string().nullable().optional(),
  insuranceNumber: z.string().nullable().optional(),
});

// Rest of the table definitions...
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileName: text("file_name").notNull(),
  notes: text("notes"),
  recordType: text("record_type").notNull(),
  recordDate: timestamp("record_date").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const labResults = pgTable("lab_results", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  testName: text("test_name").notNull(),
  testDate: timestamp("test_date").notNull(),
  results: jsonb("results").notNull(),
  referenceRange: jsonb("reference_range"),
  status: text("status").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  medication: text("medication").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").notNull(),
  prescribedBy: text("prescribed_by").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicalHistory = pgTable("medical_history", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  eventType: text("event_type").notNull(),
  eventDate: timestamp("event_date").notNull(),
  description: text("description").notNull(),
  severity: text("severity"),
  outcome: text("outcome"),
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
  medicalRecords: many(medicalRecords),
  labResults: many(labResults),
  prescriptions: many(prescriptions),
  medicalHistory: many(medicalHistory),
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

export const medicalRecordsRelations = relations(medicalRecords, ({ one }) => ({
  patient: one(patients, {
    fields: [medicalRecords.patientId],
    references: [patients.id],
  }),
}));

export const labResultsRelations = relations(labResults, ({ one }) => ({
  patient: one(patients, {
    fields: [labResults.patientId],
    references: [patients.id],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
}));

export const medicalHistoryRelations = relations(medicalHistory, ({ one }) => ({
  patient: one(patients, {
    fields: [medicalHistory.patientId],
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

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords);
export const selectMedicalRecordSchema = createSelectSchema(medicalRecords);
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type SelectMedicalRecord = z.infer<typeof selectMedicalRecordSchema>;

export const insertLabResultSchema = createInsertSchema(labResults);
export const selectLabResultSchema = createSelectSchema(labResults);
export type InsertLabResult = z.infer<typeof insertLabResultSchema>;
export type SelectLabResult = z.infer<typeof selectLabResultSchema>;

export const insertPrescriptionSchema = createInsertSchema(prescriptions);
export const selectPrescriptionSchema = createSelectSchema(prescriptions);
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type SelectPrescription = z.infer<typeof selectPrescriptionSchema>;

export const insertMedicalHistorySchema = createInsertSchema(medicalHistory);
export const selectMedicalHistorySchema = createSelectSchema(medicalHistory);
export type InsertMedicalHistory = z.infer<typeof insertMedicalHistorySchema>;
export type SelectMedicalHistory = z.infer<typeof selectMedicalHistorySchema>;

export const insertTeleconsultationSchema = createInsertSchema(teleconsultations);
export const selectTeleconsultationSchema = createSelectSchema(teleconsultations);
export type InsertTeleconsultation = z.infer<typeof insertTeleconsultationSchema>;
export type SelectTeleconsultation = z.infer<typeof selectTeleconsultationSchema>;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type SelectPatient = z.infer<typeof selectPatientSchema>;