import { pgTable, text, serial, integer, boolean, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

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
  healthConditions: text("health_conditions").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

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

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const insertPatientSchema = createInsertSchema(patients);
export const selectPatientSchema = createSelectSchema(patients);
export type InsertPatient = typeof patients.$inferInsert;
export type SelectPatient = typeof patients.$inferSelect;

export const insertAppointmentSchema = createInsertSchema(appointments);
export const selectAppointmentSchema = createSelectSchema(appointments);
export type InsertAppointment = typeof appointments.$inferInsert;
export type SelectAppointment = typeof appointments.$inferSelect;

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords);
export const selectMedicalRecordSchema = createSelectSchema(medicalRecords);
export type InsertMedicalRecord = typeof medicalRecords.$inferInsert;
export type SelectMedicalRecord = typeof medicalRecords.$inferSelect;

export const insertLabResultSchema = createInsertSchema(labResults);
export const selectLabResultSchema = createSelectSchema(labResults);
export type InsertLabResult = typeof labResults.$inferInsert;
export type SelectLabResult = typeof labResults.$inferSelect;

export const insertPrescriptionSchema = createInsertSchema(prescriptions);
export const selectPrescriptionSchema = createSelectSchema(prescriptions);
export type InsertPrescription = typeof prescriptions.$inferInsert;
export type SelectPrescription = typeof prescriptions.$inferSelect;

export const insertMedicalHistorySchema = createInsertSchema(medicalHistory);
export const selectMedicalHistorySchema = createSelectSchema(medicalHistory);
export type InsertMedicalHistory = typeof medicalHistory.$inferInsert;
export type SelectMedicalHistory = typeof medicalHistory.$inferSelect;

export const insertTeleconsultationSchema = createInsertSchema(teleconsultations);
export const selectTeleconsultationSchema = createSelectSchema(teleconsultations);
export type InsertTeleconsultation = typeof teleconsultations.$inferInsert;
export type SelectTeleconsultation = typeof teleconsultations.$inferSelect;