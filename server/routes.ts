import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { appointments, patients, medicalRecords, labResults, prescriptions, medicalHistory } from "@db/schema";
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

  // Medical Records API
  app.get("/api/patients/:patientId/medical-records", async (req, res) => {
    const records = await db.query.medicalRecords.findMany({
      where: eq(medicalRecords.patientId, parseInt(req.params.patientId)),
      with: {
        patient: true,
      },
    });
    res.json(records);
  });

  app.post("/api/patients/:patientId/medical-records", async (req, res) => {
    const record = await db
      .insert(medicalRecords)
      .values({
        ...req.body,
        patientId: parseInt(req.params.patientId),
      })
      .returning();
    res.json(record[0]);
  });

  // Lab Results API
  app.get("/api/patients/:patientId/lab-results", async (req, res) => {
    const results = await db.query.labResults.findMany({
      where: eq(labResults.patientId, parseInt(req.params.patientId)),
      with: {
        patient: true,
      },
    });
    res.json(results);
  });

  app.post("/api/patients/:patientId/lab-results", async (req, res) => {
    const result = await db
      .insert(labResults)
      .values({
        ...req.body,
        patientId: parseInt(req.params.patientId),
      })
      .returning();
    res.json(result[0]);
  });

  // Prescriptions API
  app.get("/api/patients/:patientId/prescriptions", async (req, res) => {
    const prescriptionList = await db.query.prescriptions.findMany({
      where: eq(prescriptions.patientId, parseInt(req.params.patientId)),
      with: {
        patient: true,
      },
    });
    res.json(prescriptionList);
  });

  app.post("/api/patients/:patientId/prescriptions", async (req, res) => {
    const prescription = await db
      .insert(prescriptions)
      .values({
        ...req.body,
        patientId: parseInt(req.params.patientId),
      })
      .returning();
    res.json(prescription[0]);
  });

  // Medical History API
  app.get("/api/patients/:patientId/medical-history", async (req, res) => {
    const history = await db.query.medicalHistory.findMany({
      where: eq(medicalHistory.patientId, parseInt(req.params.patientId)),
      with: {
        patient: true,
      },
    });
    res.json(history);
  });

  app.post("/api/patients/:patientId/medical-history", async (req, res) => {
    const entry = await db
      .insert(medicalHistory)
      .values({
        ...req.body,
        patientId: parseInt(req.params.patientId),
      })
      .returning();
    res.json(entry[0]);
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