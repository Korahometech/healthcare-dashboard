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

  /**
   * @swagger
   * components:
   *   schemas:
   *     Patient:
   *       type: object
   *       required:
   *         - name
   *         - email
   *       properties:
   *         id:
   *           type: integer
   *           description: Auto-generated ID
   *         name:
   *           type: string
   *           description: Patient's full name
   *         email:
   *           type: string
   *           format: email
   *           description: Patient's email address
   *         phone:
   *           type: string
   *           description: Patient's contact number
   *         dateOfBirth:
   *           type: string
   *           format: date
   *           description: Patient's date of birth
   *         healthConditions:
   *           type: array
   *           items:
   *             type: string
   *           description: List of patient's health conditions
   *         medications:
   *           type: array
   *           items:
   *             type: string
   *           description: List of current medications
   *         allergies:
   *           type: array
   *           items:
   *             type: string
   *           description: List of allergies
   *         chronicConditions:
   *           type: array
   *           items:
   *             type: string
   *           description: List of chronic conditions
   *     
   *     Appointment:
   *       type: object
   *       required:
   *         - patientId
   *         - doctorId
   *         - date
   *       properties:
   *         id:
   *           type: integer
   *           description: Auto-generated ID
   *         patientId:
   *           type: integer
   *           description: ID of the patient
   *         doctorId:
   *           type: integer
   *           description: ID of the doctor
   *         date:
   *           type: string
   *           format: date-time
   *           description: Appointment date and time
   *         status:
   *           type: string
   *           enum: [scheduled, confirmed, cancelled]
   *           description: Current status of the appointment
   *         notes:
   *           type: string
   *           description: Additional notes about the appointment
   *         teleconsultation:
   *           type: object
   *           properties:
   *             meetingUrl:
   *               type: string
   *               description: Video consultation meeting URL
   *             duration:
   *               type: integer
   *               description: Duration in minutes
   *     
   *     LabResult:
   *       type: object
   *       required:
   *         - patientId
   *         - testType
   *         - result
   *       properties:
   *         id:
   *           type: integer
   *         patientId:
   *           type: integer
   *         testType:
   *           type: string
   *         result:
   *           type: string
   *         date:
   *           type: string
   *           format: date-time
   *     
   *     RiskAssessment:
   *       type: object
   *       required:
   *         - patientId
   *         - riskFactors
   *         - riskLevel
   *       properties:
   *         id:
   *           type: integer
   *         patientId:
   *           type: integer
   *         riskFactors:
   *           type: array
   *           items:
   *             type: string
   *         riskLevel:
   *           type: string
   *           enum: [low, medium, high]
   */

  /**
   * @swagger
   * /api/patients:
   *   get:
   *     summary: Retrieve all patients
   *     description: Get a list of all patients in the system
   *     tags: [Patients]
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
   *   post:
   *     summary: Create a new patient
   *     description: Add a new patient to the system
   *     tags: [Patients]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Patient'
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

  /**
   * @swagger
   * /api/patients/{id}:
   *   delete:
   *     summary: Delete a patient
   *     description: Delete a patient and all related records
   *     tags: [Patients]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Patient ID
   *     responses:
   *       200:
   *         description: Patient deleted successfully
   *       500:
   *         description: Server error
   */
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

  /**
   * @swagger
   * /api/patients/{patientId}/lab-results:
   *   get:
   *     summary: Get patient's lab results
   *     description: Retrieve all lab results for a specific patient
   *     tags: [Lab Results]
   *     parameters:
   *       - in: path
   *         name: patientId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Patient ID
   *     responses:
   *       200:
   *         description: List of lab results
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/LabResult'
   *   post:
   *     summary: Create lab result
   *     description: Add a new lab result for a specific patient
   *     tags: [Lab Results]
   *     parameters:
   *       - in: path
   *         name: patientId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Patient ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LabResult'
   *     responses:
   *       200:
   *         description: Created lab result
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LabResult'
   */
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

  /**
   * @swagger
   * /api/appointments:
   *   get:
   *     summary: Get all appointments
   *     description: Retrieve all appointments with patient and teleconsultation details
   *     tags: [Appointments]
   *     responses:
   *       200:
   *         description: List of appointments
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Appointment'
   *   post:
   *     summary: Create appointment
   *     description: Schedule a new appointment with optional teleconsultation
   *     tags: [Appointments]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Appointment'
   *     responses:
   *       200:
   *         description: Created appointment
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Appointment'
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

  /**
   * @swagger
   * /api/appointments/{id}/status:
   *   put:
   *     summary: Update appointment status
   *     description: Update the status of an existing appointment
   *     tags: [Appointments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Appointment ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [scheduled, confirmed, cancelled]
   *     responses:
   *       200:
   *         description: Updated appointment
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Appointment'
   */
  app.put("/api/appointments/:id/status", async (req, res) => {
    const { status } = req.body;
    const appointment = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, parseInt(req.params.id)))
      .returning();
    res.json(appointment[0]);
  });

  /**
   * @swagger
   * /api/risk-assessments:
   *   post:
   *     summary: Create risk assessment
   *     description: Create a new risk assessment for a patient
   *     tags: [Risk Assessments]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RiskAssessment'
   *     responses:
   *       200:
   *         description: Created risk assessment
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RiskAssessment'
   */
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