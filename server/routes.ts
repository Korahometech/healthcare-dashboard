import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { appointments, patients, labResults, teleconsultations, carePlans, treatments, medications, healthGoals, progressEntries } from "@db/schema";
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

  // Appointments API
  app.get("/api/appointments", async (req, res) => {
    const allAppointments = await db.query.appointments.findMany({
      with: {
        patient: true,
        teleconsultation: true,
      },
    });
    res.json(allAppointments);
  });

  app.post("/api/appointments", async (req, res) => {
    const { isTeleconsultation, meetingUrl, duration, ...appointmentData } = req.body;

    try {
      // Start a transaction to create both appointment and teleconsultation
      const appointment = await db.transaction(async (tx) => {
        const [newAppointment] = await tx
          .insert(appointments)
          .values(appointmentData)
          .returning();

        if (isTeleconsultation) {
          await tx.insert(teleconsultations).values({
            appointmentId: newAppointment.id,
            meetingUrl,
            duration,
            startTime: new Date(appointmentData.date),
            status: "scheduled",
          });
        }

        return newAppointment;
      });

      const appointmentWithDetails = await db.query.appointments.findFirst({
        where: eq(appointments.id, appointment.id),
        with: {
          patient: true,
          teleconsultation: true,
        },
      });

      res.json(appointmentWithDetails);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ 
        error: 'Failed to create appointment',
        details: error.message 
      });
    }
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

  // Teleconsultation API
  app.get("/api/teleconsultations", async (req, res) => {
    const allConsultations = await db.query.teleconsultations.findMany({
      with: {
        appointment: {
          with: {
            patient: true,
          },
        },
      },
    });
    res.json(allConsultations);
  });

  app.put("/api/teleconsultations/:id", async (req, res) => {
    const { status, endTime } = req.body;
    const consultation = await db
      .update(teleconsultations)
      .set({ status, endTime })
      .where(eq(teleconsultations.id, parseInt(req.params.id)))
      .returning();
    res.json(consultation[0]);
  });

  // Care Plans API
  app.get("/api/patients/:patientId/care-plans", async (req, res) => {
    const carePlansList = await db.query.carePlans.findMany({
      where: eq(carePlans.patientId, parseInt(req.params.patientId)),
      with: {
        treatments: true,
        medications: true,
        healthGoals: {
          with: {
            progressEntries: true,
          },
        },
      },
    });
    res.json(carePlansList);
  });

  app.post("/api/patients/:patientId/care-plans", async (req, res) => {
    const carePlan = await db
      .insert(carePlans)
      .values({
        ...req.body,
        patientId: parseInt(req.params.patientId),
      })
      .returning();
    res.json(carePlan[0]);
  });

  // Treatments API
  app.post("/api/care-plans/:carePlanId/treatments", async (req, res) => {
    const treatment = await db
      .insert(treatments)
      .values({
        ...req.body,
        carePlanId: parseInt(req.params.carePlanId),
      })
      .returning();
    res.json(treatment[0]);
  });

  // Medications API
  app.post("/api/care-plans/:carePlanId/medications", async (req, res) => {
    const medication = await db
      .insert(medications)
      .values({
        ...req.body,
        carePlanId: parseInt(req.params.carePlanId),
      })
      .returning();
    res.json(medication[0]);
  });

  // Health Goals API
  app.post("/api/care-plans/:carePlanId/goals", async (req, res) => {
    const goal = await db
      .insert(healthGoals)
      .values({
        ...req.body,
        carePlanId: parseInt(req.params.carePlanId),
      })
      .returning();
    res.json(goal[0]);
  });

  // Progress Entries API
  app.post("/api/goals/:goalId/progress", async (req, res) => {
    const entry = await db
      .insert(progressEntries)
      .values({
        ...req.body,
        healthGoalId: parseInt(req.params.goalId),
      })
      .returning();
    res.json(entry[0]);
  });

  const httpServer = createServer(app);
  return httpServer;
}