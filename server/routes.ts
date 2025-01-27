import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { 
  appointments, 
  patients, 
  labResults, 
  teleconsultations, 
  carePlans, 
  treatments, 
  medications, 
  healthGoals, 
  progressEntries,
  geneticProfiles,
  biomarkerData,
  treatmentResponses,
  environmentalFactors,
  riskAssessments
} from "@db/schema";
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

  // Genetic Profiles API
  app.get("/api/genetic-profiles", async (req, res) => {
    try {
      const profiles = await db.query.geneticProfiles.findMany({
        with: {
          patient: true,
        },
      });
      res.json(profiles);
    } catch (error: any) {
      console.error('Error fetching genetic profiles:', error);
      res.status(500).json({
        error: 'Failed to fetch genetic profiles',
        details: error.message
      });
    }
  });

  app.get("/api/patients/:patientId/genetic-profiles", async (req, res) => {
    try {
      const profiles = await db.query.geneticProfiles.findMany({
        where: eq(geneticProfiles.patientId, parseInt(req.params.patientId)),
      });
      res.json(profiles);
    } catch (error: any) {
      console.error('Error fetching patient genetic profiles:', error);
      res.status(500).json({
        error: 'Failed to fetch patient genetic profiles',
        details: error.message
      });
    }
  });

  app.post("/api/genetic-profiles", async (req, res) => {
    try {
      const profile = await db
        .insert(geneticProfiles)
        .values(req.body)
        .returning();
      res.json(profile[0]);
    } catch (error: any) {
      console.error('Error creating genetic profile:', error);
      res.status(500).json({
        error: 'Failed to create genetic profile',
        details: error.message
      });
    }
  });

  // Biomarker Data API
  app.get("/api/patients/:patientId/biomarkers", async (req, res) => {
    try {
      const biomarkers = await db.query.biomarkerData.findMany({
        where: eq(biomarkerData.patientId, parseInt(req.params.patientId)),
      });
      res.json(biomarkers);
    } catch (error: any) {
      console.error('Error fetching biomarker data:', error);
      res.status(500).json({
        error: 'Failed to fetch biomarker data',
        details: error.message
      });
    }
  });

  app.post("/api/biomarkers", async (req, res) => {
    try {
      const biomarker = await db
        .insert(biomarkerData)
        .values(req.body)
        .returning();
      res.json(biomarker[0]);
    } catch (error: any) {
      console.error('Error creating biomarker data:', error);
      res.status(500).json({
        error: 'Failed to create biomarker data',
        details: error.message
      });
    }
  });

  // Treatment Responses API
  app.get("/api/patients/:patientId/treatment-responses", async (req, res) => {
    try {
      const responses = await db.query.treatmentResponses.findMany({
        where: eq(treatmentResponses.patientId, parseInt(req.params.patientId)),
      });
      res.json(responses);
    } catch (error: any) {
      console.error('Error fetching treatment responses:', error);
      res.status(500).json({
        error: 'Failed to fetch treatment responses',
        details: error.message
      });
    }
  });

  app.post("/api/treatment-responses", async (req, res) => {
    try {
      const response = await db
        .insert(treatmentResponses)
        .values(req.body)
        .returning();
      res.json(response[0]);
    } catch (error: any) {
      console.error('Error creating treatment response:', error);
      res.status(500).json({
        error: 'Failed to create treatment response',
        details: error.message
      });
    }
  });

  // Risk Assessments API
  app.get("/api/patients/:patientId/risk-assessments", async (req, res) => {
    try {
      const assessments = await db.query.riskAssessments.findMany({
        where: eq(riskAssessments.patientId, parseInt(req.params.patientId)),
      });
      res.json(assessments);
    } catch (error: any) {
      console.error('Error fetching risk assessments:', error);
      res.status(500).json({
        error: 'Failed to fetch risk assessments',
        details: error.message
      });
    }
  });

  app.post("/api/risk-assessments", async (req, res) => {
    try {
      const assessment = await db
        .insert(riskAssessments)
        .values(req.body)
        .returning();
      res.json(assessment[0]);
    } catch (error: any) {
      console.error('Error creating risk assessment:', error);
      res.status(500).json({
        error: 'Failed to create risk assessment',
        details: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}