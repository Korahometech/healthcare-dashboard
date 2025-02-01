import { sql } from "drizzle-orm";
import { date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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

export const insertDoctorSchema = createInsertSchema(doctors, {
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  specialtyId: z.number().int().optional(),
  qualification: z.string().optional(),
  experience: z.number().int().min(0).optional(),
  availableDays: z.array(
    z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
  ).optional(),
  startDate: z.date().optional(),
});

export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type SelectDoctor = typeof doctors.$inferSelect;