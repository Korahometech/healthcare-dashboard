import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { appointments, patients } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Patients API
  app.get("/api/patients", async (req, res) => {
    const allPatients = await db.query.patients.findMany();
    res.json(allPatients);
  });

  app.post("/api/patients", async (req, res) => {
    const patient = await db.insert(patients).values(req.body).returning();
    res.json(patient[0]);
  });

  app.delete("/api/patients/:id", async (req, res) => {
    await db.delete(patients).where(eq(patients.id, parseInt(req.params.id)));
    res.json({ success: true });
  });

  // Appointments API
  app.get("/api/appointments", async (req, res) => {
    const allAppointments = await db.query.appointments.findMany({
      with: {
        patient: true,
      },
    });
    res.json(allAppointments);
  });

  app.post("/api/appointments", async (req, res) => {
    const appointment = await db.insert(appointments).values(req.body).returning();
    res.json(appointment[0]);
  });

  app.put("/api/appointments/:id/status", async (req, res) => {
    const { status } = req.body;
    const appointment = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, parseInt(req.params.id)))
      .returning();
    res.json(appointment[0]);
  });

  const httpServer = createServer(app);
  return httpServer;
}
