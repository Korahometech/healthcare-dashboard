import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
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

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const insertPatientSchema = createInsertSchema(patients);
export const selectPatientSchema = createSelectSchema(patients);
export type SelectPatient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

export const insertAppointmentSchema = createInsertSchema(appointments);
export const selectAppointmentSchema = createSelectSchema(appointments);
export type SelectAppointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;