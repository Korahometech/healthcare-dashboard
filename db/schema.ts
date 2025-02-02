import { pgTable, text, serial, integer, boolean, timestamp, date, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

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

  // Additional fields for enhanced patient management
  status: text("status").default("active"),
  medicalNotes: text("medical_notes"),

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
  status: z.enum(['active', 'inactive']).default('active'),
  medicalNotes: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  emergencyContactRelation: z.enum(['spouse', 'parent', 'child', 'sibling', 'friend', 'other']).nullable().optional(),
});

export const selectPatientSchema = createSelectSchema(patients);

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  doctorId: integer("doctor_id").references(() => doctors.id), // Add doctor reference
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

// New tables for medical documents
export const medicalDocuments = pgTable("medical_documents", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  originalLanguage: text("original_language").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, error
  uploadedBy: integer("uploaded_by").references(() => doctors.id),
  secureUrl: text("secure_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const documentTranslations = pgTable("document_translations", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => medicalDocuments.id),
  targetLanguage: text("target_language").notNull(),
  translatedUrl: text("translated_url"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, error
  requestedBy: integer("requested_by").references(() => doctors.id),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Add before export section, after the existing tables

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  email: z.string().email().optional(),
  role: z.enum(["user", "admin"]).default("user"),
});

export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

// Relations
export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
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


// Add to the existing relations section
export const medicalDocumentsRelations = relations(medicalDocuments, ({ one, many }) => ({
  patient: one(patients, {
    fields: [medicalDocuments.patientId],
    references: [patients.id],
  }),
  uploader: one(doctors, {
    fields: [medicalDocuments.uploadedBy],
    references: [doctors.id],
  }),
  translations: many(documentTranslations),
}));

export const documentTranslationsRelations = relations(documentTranslations, ({ one }) => ({
  document: one(medicalDocuments, {
    fields: [documentTranslations.documentId],
    references: [medicalDocuments.id],
  }),
  requestedByDoctor: one(doctors, {
    fields: [documentTranslations.requestedBy],
    references: [doctors.id],
  }),
}));

// Add to the existing relations
export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  medicalDocuments: many(medicalDocuments),
}));

// Type exports
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


// New tables for personalized medicine

export const geneticProfiles = pgTable("genetic_profiles", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  dnaSequenceData: jsonb("dna_sequence_data"),
  geneticMarkers: jsonb("genetic_markers"),
  ancestryInformation: jsonb("ancestry_information"),
  diseaseRiskFactors: jsonb("disease_risk_factors"),
  drugResponseMarkers: jsonb("drug_response_markers"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  reportDate: date("report_date").notNull(),
  laboratoryInfo: text("laboratory_info"),
  methodologyUsed: text("methodology_used"),
  interpretationNotes: text("interpretation_notes"),
});

export const biomarkerData = pgTable("biomarker_data", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  biomarkerType: text("biomarker_type").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  referenceRange: jsonb("reference_range"),
  collectionDate: timestamp("collection_date").notNull(),
  testMethod: text("test_method"),
  laboratoryInfo: text("laboratory_info"),
  interpretationNotes: text("interpretation_notes"),
  status: text("status").notNull(),
});

export const treatmentResponses = pgTable("treatment_responses", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  treatmentId: integer("treatment_id").references(() => treatments.id),
  responseLevel: text("response_level").notNull(), // positive, negative, neutral
  sideEffects: text("side_effects").array(),
  efficacyScore: integer("efficacy_score"), // 1-10
  tolerabilityScore: integer("tolerability_score"), // 1-10
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  biomarkerChanges: jsonb("biomarker_changes"),
  notes: text("notes"),
});

export const environmentalFactors = pgTable("environmental_factors", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  factorType: text("factor_type").notNull(), // air quality, diet, lifestyle, etc.
  exposure: jsonb("exposure").notNull(),
  intensity: text("intensity").notNull(), // low, medium, high
  duration: integer("duration"), // in hours
  recordDate: timestamp("record_date").notNull(),
  location: text("location"),
  source: text("source"),
  mitigationStrategies: text("mitigation_strategies").array(),
  impactAssessment: text("impact_assessment"),
});

export const riskAssessments = pgTable("risk_assessments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  condition: text("condition").notNull(),
  riskLevel: text("risk_level").notNull(), // low, medium, high
  geneticFactors: jsonb("genetic_factors"),
  environmentalFactors: jsonb("environmental_factors"),
  lifestyleFactors: jsonb("lifestyle_factors"),
  biomarkerFactors: jsonb("biomarker_factors"),
  recommendedActions: text("recommended_actions").array(),
  assessmentDate: timestamp("assessment_date").notNull(),
  nextReviewDate: date("next_review_date"),
  assessedBy: text("assessed_by"),
  notes: text("notes"),
});

// Add relations
export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  labResults: many(labResults),
  geneticProfiles: many(geneticProfiles),
  biomarkerData: many(biomarkerData),
  treatmentResponses: many(treatmentResponses),
  environmentalFactors: many(environmentalFactors),
  riskAssessments: many(riskAssessments),
    medicalDocuments: many(medicalDocuments),
}));

// Create schemas for new tables
export const insertGeneticProfileSchema = createInsertSchema(geneticProfiles);
export const selectGeneticProfileSchema = createSelectSchema(geneticProfiles);
export type InsertGeneticProfile = z.infer<typeof insertGeneticProfileSchema>;
export type SelectGeneticProfile = z.infer<typeof selectGeneticProfileSchema>;

export const insertBiomarkerDataSchema = createInsertSchema(biomarkerData);
export const selectBiomarkerDataSchema = createSelectSchema(biomarkerData);
export type InsertBiomarkerData = z.infer<typeof insertBiomarkerDataSchema>;
export type SelectBiomarkerData = z.infer<typeof selectBiomarkerDataSchema>;

export const insertTreatmentResponseSchema = createInsertSchema(treatmentResponses);
export const selectTreatmentResponseSchema = createSelectSchema(treatmentResponses);
export type InsertTreatmentResponse = z.infer<typeof insertTreatmentResponseSchema>;
export type SelectTreatmentResponse = z.infer<typeof selectTreatmentResponseSchema>;

export const insertEnvironmentalFactorSchema = createInsertSchema(environmentalFactors);
export const selectEnvironmentalFactorSchema = createSelectSchema(environmentalFactors);
export type InsertEnvironmentalFactor = z.infer<typeof insertEnvironmentalFactorSchema>;
export type SelectEnvironmentalFactor = z.infer<typeof selectEnvironmentalFactorSchema>;

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments);
export const selectRiskAssessmentSchema = createSelectSchema(riskAssessments);
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type SelectRiskAssessment = z.infer<typeof selectRiskAssessmentSchema>;


// Add new tables for doctors and specialties
export const specialties = pgTable("specialties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  specialtyId: integer("specialty_id").references(() => specialties.id),
  qualification: text("qualification"),
  experience: integer("experience"), // in years
  availableDays: text("available_days").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Add relations
export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  specialty: one(specialties, {
    fields: [doctors.specialtyId],
    references: [specialties.id],
  }),
  appointments: many(appointments),
}));


// Add schemas for new tables
export const insertSpecialtySchema = createInsertSchema(specialties);
export const selectSpecialtySchema = createSelectSchema(specialties);
export type InsertSpecialty = z.infer<typeof insertSpecialtySchema>;
export type SelectSpecialty = z.infer<typeof selectSpecialtySchema>;

export const insertDoctorSchema = createInsertSchema(doctors).extend({
  availableDays: z.array(z.string()).nullable().optional(),
});
export const selectDoctorSchema = createSelectSchema(doctors);
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type SelectDoctor = z.infer<typeof selectDoctorSchema>;

// Add to the exports section
export const insertMedicalDocumentSchema = createInsertSchema(medicalDocuments);
export const selectMedicalDocumentSchema = createSelectSchema(medicalDocuments);
export type InsertMedicalDocument = z.infer<typeof insertMedicalDocumentSchema>;
export type SelectMedicalDocument = z.infer<typeof selectMedicalDocumentSchema>;

export const insertDocumentTranslationSchema = createInsertSchema(documentTranslations);
export const selectDocumentTranslationSchema = createSelectSchema(documentTranslations);
export type InsertDocumentTranslation = z.infer<typeof insertDocumentTranslationSchema>;
export type SelectDocumentTranslation = z.infer<typeof selectDocumentTranslationSchema>;

// Add after the existing tables
export const symptomJournals = pgTable("symptom_journals", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  symptoms: text("symptoms").array(),
  severity: integer("severity").notNull(),
  mood: text("mood").notNull(),
  notes: text("notes"),
  dateRecorded: timestamp("date_recorded").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const symptomAnalysis = pgTable("symptom_analysis", {
  id: serial("id").primaryKey(),
  journalId: integer("journal_id").references(() => symptomJournals.id),
  analysis: jsonb("analysis").notNull(),
  sentiment: text("sentiment").notNull(),
  suggestedActions: text("suggested_actions").array(),
  aiConfidence: real("ai_confidence"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Add to the existing relations section
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

// Add to the exports section
export const insertSymptomJournalSchema = createInsertSchema(symptomJournals);
export const selectSymptomJournalSchema = createSelectSchema(symptomJournals);
export type InsertSymptomJournal = z.infer<typeof insertSymptomJournalSchema>;
export type SelectSymptomJournal = z.infer<typeof selectSymptomJournalSchema>;

export const insertSymptomAnalysisSchema = createInsertSchema(symptomAnalysis);
export const selectSymptomAnalysisSchema = createSelectSchema(symptomAnalysis);
export type InsertSymptomAnalysis = z.infer<typeof insertSymptomAnalysisSchema>;
export type SelectSymptomAnalysis = z.infer<typeof selectSymptomAnalysisSchema>;


// Add after the existing tables

export const appointmentAnalytics = pgTable("appointment_analytics", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  doctorId: integer("doctor_id").references(() => doctors.id),
  scheduledTime: timestamp("scheduled_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  waitTime: integer("wait_time"), // in minutes
  dayOfWeek: integer("day_of_week").notNull(),
  timeSlot: text("time_slot").notNull(), // e.g., "morning", "afternoon", "evening"
  predictedWaitTime: integer("predicted_wait_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Add to exports section
export const appointmentAnalyticsRelations = relations(appointmentAnalytics, ({ one }) => ({
  appointment: one(appointments, {
    fields: [appointmentAnalytics.appointmentId],
    references: [appointments.id],
  }),
  doctor: one(doctors, {
    fields: [appointmentAnalytics.doctorId],
    references: [doctors.id],
  }),
}));

export const insertAppointmentAnalyticsSchema = createInsertSchema(appointmentAnalytics);
export const selectAppointmentAnalyticsSchema = createSelectSchema(appointmentAnalytics);
export type InsertAppointmentAnalytics = z.infer<typeof insertAppointmentAnalyticsSchema>;
export type SelectAppointmentAnalytics = z.infer<typeof selectAppointmentAnalyticsSchema>;