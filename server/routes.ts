import type { Express } from "express";
import { createServer, type Server } from "http";
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger';
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
  riskAssessments,
  doctors
} from "@db/schema";
import { eq } from "drizzle-orm";
import { sendEmail, generateAppointmentEmail } from "./lib/email";

export function registerRoutes(app: Express): Server {
  // Swagger UI route
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

  // Patients API
  /**
   * @swagger
   * /patients:
   *   get:
   *     summary: Retrieve all patients
   *     description: Get a list of all patients in the system
   *     responses:
   *       200:
   *         description: A list of patients
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Patient'
   *       500:
   *         description: Server error
   */
  app.get("/api/patients", async (req, res) => {
    try {
      const allPatients = await db.query.patients.findMany({
        orderBy: (patients, { desc }) => [desc(patients.createdAt)],
      });
      res.json(allPatients);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      res.status(500).json({
        error: 'Failed to fetch patients',
        details: error.message
      });
    }
  });

  /**
   * @swagger
   * /patients:
   *   post:
   *     summary: Create a new patient
   *     description: Add a new patient to the system
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PatientInput'
   *     responses:
   *       200:
   *         description: The created patient
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Patient'
   *       500:
   *         description: Server error
   */
  app.post("/api/patients", async (req, res) => {
    try {
      const patientData = {
        ...req.body,
        healthConditions: req.body.healthConditions || [],
        medications: req.body.medications || [],
        allergies: req.body.allergies || [],
        chronicConditions: req.body.chronicConditions || [],
      };

      const patient = await db.insert(patients).values(patientData).returning();
      res.json(patient[0]);
    } catch (error: any) {
      console.error('Error creating patient:', error);
      res.status(500).json({
        error: 'Failed to create patient',
        details: error.message
      });
    }
  });

  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);

      await db.transaction(async (tx) => {
        await tx.delete(appointments).where(eq(appointments.patientId, patientId));
        await tx.delete(labResults).where(eq(labResults.patientId, patientId));
        await tx.delete(carePlans).where(eq(carePlans.patientId, patientId));
        await tx.delete(geneticProfiles).where(eq(geneticProfiles.patientId, patientId));
        await tx.delete(biomarkerData).where(eq(biomarkerData.patientId, patientId));
        await tx.delete(treatmentResponses).where(eq(treatmentResponses.patientId, patientId));
        await tx.delete(environmentalFactors).where(eq(environmentalFactors.patientId, patientId));
        await tx.delete(riskAssessments).where(eq(riskAssessments.patientId, patientId));

        await tx.delete(patients).where(eq(patients.id, patientId));
      });

      res.json({ success: true, message: 'Patient and related records deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      res.status(500).json({
        error: 'Failed to delete patient',
        details: error.message
      });
    }
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
  /**
   * @swagger
   * /appointments:
   *   get:
   *     summary: Retrieve all appointments
   *     description: Get a list of all appointments with patient and teleconsultation details
   *     responses:
   *       200:
   *         description: A list of appointments
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Appointment'
   */
  app.get("/api/appointments", async (req, res) => {
    const allAppointments = await db.query.appointments.findMany({
      with: {
        patient: true,
        teleconsultation: true,
      },
    });
    res.json(allAppointments);
  });

  /**
   * @swagger
   * /appointments:
   *   post:
   *     summary: Create a new appointment
   *     description: Schedule a new appointment with optional teleconsultation
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AppointmentInput'
   *     responses:
   *       200:
   *         description: The created appointment
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Appointment'
   *       500:
   *         description: Server error
   */
  app.post("/api/appointments", async (req, res) => {
    const { isTeleconsultation, meetingUrl, duration, ...appointmentData } = req.body;

    try {
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
          doctor: true,
          teleconsultation: true,
        },
      });

      // Send email notifications
      if (appointmentWithDetails && appointmentWithDetails.patient && appointmentWithDetails.doctor) {
        const emailData = generateAppointmentEmail({
          date: appointmentWithDetails.date,
          patient: appointmentWithDetails.patient,
          doctor: appointmentWithDetails.doctor,
          notes: appointmentWithDetails.notes || undefined,
          isTeleconsultation: !!appointmentWithDetails.teleconsultation,
          meetingUrl: appointmentWithDetails.teleconsultation?.meetingUrl,
        });

        Promise.all([
          sendEmail(emailData.patient),
          sendEmail(emailData.doctor),
        ]).catch((error) => {
          console.error('Error sending appointment notification emails:', error);
        });
      }

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

  /**
   * @swagger
   * components:
   *   schemas:
   *     Patient:
   *       type: object
   *       properties:
   *         id:
   *           type: integer
   *         name:
   *           type: string
   *         email:
   *           type: string
   *         phone:
   *           type: string
   *         dateOfBirth:
   *           type: string
   *           format: date
   *         healthConditions:
   *           type: array
   *           items:
   *             type: string
   *         medications:
   *           type: array
   *           items:
   *             type: string
   *         allergies:
   *           type: array
   *           items:
   *             type: string
   *         chronicConditions:
   *           type: array
   *           items:
   *             type: string
   *     Appointment:
   *       type: object
   *       properties:
   *         id:
   *           type: integer
   *         patientId:
   *           type: integer
   *         doctorId:
   *           type: integer
   *         date:
   *           type: string
   *           format: date-time
   *         status:
   *           type: string
   *           enum: [scheduled, confirmed, cancelled]
   *         notes:
   *           type: string
   *         teleconsultation:
   *           type: object
   *           properties:
   *             meetingUrl:
   *               type: string
   *             duration:
   *               type: integer
   */

  const httpServer = createServer(app);
  return httpServer;
}