import { pgTable, text, serial, timestamp, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table and schemas
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

// Patients table and schemas
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  height: integer("height"), // in cm
  weight: integer("weight"), // in kg
  bloodType: text("blood_type"),
  healthConditions: text("health_conditions").array(),
  medications: text("medications").array(),
  allergies: text("allergies").array(),
  chronicConditions: text("chronic_conditions").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertPatientSchema = createInsertSchema(patients, {
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  height: z.number().min(0).max(300).optional(),
  weight: z.number().min(0).max(500).optional(),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  healthConditions: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  chronicConditions: z.array(z.string()).default([]),
});

export const selectPatientSchema = createSelectSchema(patients);

// Appointments table and schemas
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  actualStartTime: timestamp("actual_start_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertAppointmentSchema = createInsertSchema(appointments, {
  patientId: z.number(),
  doctorId: z.number(),
  date: z.coerce.date(),
  status: z.enum(["scheduled", "confirmed", "cancelled", "rescheduled"]).default("scheduled"),
  notes: z.string().optional(),
});

export const selectAppointmentSchema = createSelectSchema(appointments);

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type SelectPatient = z.infer<typeof selectPatientSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type SelectAppointment = z.infer<typeof selectAppointmentSchema>;