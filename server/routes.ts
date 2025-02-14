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
  doctors,
  specialties,
  symptomJournals,
  symptomAnalysis,
  appointmentAnalytics
} from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { sendEmail, generateAppointmentEmail } from "./lib/email";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import { medicalDocuments, documentTranslations } from "@db/schema";
import { format, parseISO, differenceInMinutes, getDay } from "date-fns";
const openai = new OpenAI();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

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
   *     
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

      // Verify if patient exists before attempting deletion
      const patient = await db.query.patients.findFirst({
        where: eq(patients.id, patientId),
      });

      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found',
          message: 'The specified patient does not exist'
        });
      }

      await db.transaction(async (tx) => {
        // Delete symptom analysis records first
        await tx.delete(symptomAnalysis)
          .where(
            eq(symptomAnalysis.journalId,
              db.select({ id: symptomJournals.id })
                .from(symptomJournals)
                .where(eq(symptomJournals.patientId, patientId))
                .limit(1)
            )
          );

        // Delete symptom journals
        await tx.delete(symptomJournals)
          .where(eq(symptomJournals.patientId, patientId));

        // Delete all associated records
        await tx.delete(appointments)
          .where(eq(appointments.patientId, patientId));
        await tx.delete(labResults)
          .where(eq(labResults.patientId, patientId));
        await tx.delete(carePlans)
          .where(eq(carePlans.patientId, patientId));
        await tx.delete(geneticProfiles)
          .where(eq(geneticProfiles.patientId, patientId));
        await tx.delete(biomarkerData)
          .where(eq(biomarkerData.patientId, patientId));
        await tx.delete(treatmentResponses)
          .where(eq(treatmentResponses.patientId, patientId));
        await tx.delete(environmentalFactors)
          .where(eq(environmentalFactors.patientId, patientId));
        await tx.delete(riskAssessments)
          .where(eq(riskAssessments.patientId, patientId));

        // Finally delete the patient
        await tx.delete(patients)
          .where(eq(patients.id, patientId));
      });

      res.json({ 
        success: true, 
        message: 'Patient and all related records deleted successfully',
        patientId 
      });
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      res.status(500).json({
        error: 'Failed to delete patient',
        details: error.message,
        // Add more specific error information
        code: error.code,
        constraint: error.constraint
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
    try {
      const allAppointments = await db.query.appointments.findMany({
        with: {
          patient: true,
          doctor: {
            with: {
              specialty: true,
            },
          },
        },
      });
      res.json(allAppointments);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({
        error: 'Failed to fetch appointments',
        details: error.message
      });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    const { isTeleconsultation, meetingUrl, duration, ...appointmentData } = req.body;

    try {
      // Convert date string to Date object
      const appointmentDate = new Date(appointmentData.date);
      if (isNaN(appointmentDate.getTime())) {
        throw new Error('Invalid appointment date');
      }

      const appointment = await db.transaction(async (tx) => {
        const [newAppointment] = await tx
          .insert(appointments)
          .values({
            ...appointmentData,
            date: appointmentDate,
            actualStartTime: null, // Initialize as null
          })
          .returning();

        if (isTeleconsultation) {
          await tx.insert(teleconsultations).values({
            appointmentId: newAppointment.id,
            meetingUrl,
            duration,
            startTime: appointmentDate,
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

      if (appointmentWithDetails?.patient && appointmentWithDetails.doctor) {
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
   * /api/appointments/{id}:
   *   put:
   *     summary: Update an appointment
   *     description: Update an existing appointment's details
   *     tags: [Appointments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Appointment'
   *     responses:
   *       200:
   *         description: Updated appointment
   */
  app.put("/api/appointments/:id", async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { isTeleconsultation, meetingUrl, duration, ...appointmentData } = req.body;

      const appointment = await db.transaction(async (tx) => {
        // Update the appointment
        const [updatedAppointment] = await tx
          .update(appointments)
          .set({
            ...appointmentData,
            date: new Date(appointmentData.date),
          })
          .where(eq(appointments.id, appointmentId))
          .returning();

        // Update teleconsultation if it exists
        if (isTeleconsultation !== undefined) {
          if (isTeleconsultation) {
            await tx
              .insert(teleconsultations)
              .values({
                appointmentId,
                meetingUrl,
                duration,
                startTime: new Date(appointmentData.date),
                status: "scheduled",
              })
              .onConflictDoUpdate({
                target: teleconsultations.appointmentId,
                set: {
                  meetingUrl,
                  duration,
                  startTime: new Date(appointmentData.date),
                },
              });
          } else {
            await tx
              .delete(teleconsultations)
              .where(eq(teleconsultations.appointmentId, appointmentId));
          }
        }

        return updatedAppointment;
      });

      const appointmentWithDetails = await db.query.appointments.findFirst({
        where: eq(appointments.id, appointmentId),
        with: {
          patient: true,
          doctor: true,
          teleconsultation: true,
        },
      });

      if (appointmentWithDetails?.patient && appointmentWithDetails.doctor) {
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
          console.error('Error sending appointment update emails:', error);
        });
      }

      res.json(appointmentWithDetails);
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      res.status(500).json({
        error: 'Failed to update appointment',
        details: error.message,
      });
    }
  });

  /**
   * @swagger
   * /api/appointments/analytics/wait-time:
   *   get:
   *     summary: Get predicted wait time
   *     description: Calculate predicted wait time based on historical data
   *     tags: [Appointments]
   *     parameters:
   *       - in: query
   *         name: doctorId
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: scheduledTime
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *     responses:
   *       200:
   *         description: Predicted wait time in minutes
   */
  app.get("/api/appointments/analytics/wait-time", async (req, res) => {
    try {
      const doctorId = parseInt(req.query.doctorId as string);
      const scheduledTime = parseISO(req.query.scheduledTime as string);
      const dayOfWeek = getDay(scheduledTime);
      const timeSlot = getTimeSlot(scheduledTime);

      // Get historical wait times for similar conditions
      const historicalData = await db.query.appointmentAnalytics.findMany({
        where: (analytics, { and, eq }) => and(
          eq(analytics.doctorId, doctorId),
          eq(analytics.dayOfWeek, dayOfWeek),
          eq(analytics.timeSlot, timeSlot)
        ),
        orderBy: (analytics, { desc }) => [desc(analytics.createdAt)],
        limit: 10,
      });

      // Calculate predicted wait time based on historical average
      const waitTimes = historicalData
        .filter(data => data.waitTime != null)
        .map(data => data.waitTime as number);

      const predictedWaitTime = waitTimes.length > 0
        ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
        : 15; // Default prediction of 15 minutes if no historical data

      res.json({ predictedWaitTime });
    } catch (error: any) {
      console.error('Error calculating wait time:', error);
      res.status(500).json({
        error: 'Failed to calculate wait time',
        details: error.message
      });
    }
  });

  /**
   * @swagger
   * /api/appointments/{id}/start:
   *   post:
   *     summary: Mark appointment as started
   *     description: Record actual start time and calculate wait time
   *     tags: [Appointments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Updated appointment and analytics
   */
  app.post("/api/appointments/:id/start", async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const startTime = new Date();

      const appointment = await db.query.appointments.findFirst({
        where: eq(appointments.id, appointmentId),
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Calculate wait time
      const waitTime = differenceInMinutes(startTime, appointment.date);

      // Update appointment with actual start time
      await db.update(appointments)
        .set({ actualStartTime: startTime })
        .where(eq(appointments.id, appointmentId));

      // Create analytics record
      const [analytics] = await db.insert(appointmentAnalytics)
        .values({
          appointmentId,
          doctorId: appointment.doctorId,
          scheduledTime: appointment.date,
          actualStartTime: startTime,
          waitTime,
          dayOfWeek: getDay(appointment.date),
          timeSlot: getTimeSlot(appointment.date),
        })
        .returning();

      res.json({ appointment, analytics });
    } catch (error: any) {
      console.error('Error starting appointment:', error);
      res.status(500).json({
        error: 'Failed to start appointment',
        details: error.message
      });
    }
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
  /**
   * @swagger
   * /api/doctors:
   *   get:
   *     summary: Get all doctors
   *     description: Retrieve a list of all doctors with their specialties
   *     tags: [Doctors]
   *     responses:
   *       200:
   *         description: List of doctors
   *       500:
   *         description: Server error
   */
  app.get("/api/doctors", async (req, res) => {
    try {
      const allDoctors = await db.query.doctors.findMany({
        with: {
          specialty: true,
        },
      });
      res.json(allDoctors);
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({
        error: 'Failed to fetch doctors',
        details: error.message
      });
    }
  });
    /**
   * @swagger
   * /api/doctors:
   *   post:
   *     summary: Create a new doctor
   *     description: Add a new doctor to the system with validation
   *     tags: [Doctors]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - specialtyId
   *             properties:
   *               name:
   *                 type: string
   *                 description: Doctor's full name
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Doctor's email address
   *               phone:
   *                 type: string
   *                 description: Doctor's contact number
   *               specialtyId:
   *                 type: integer
   *                 description: ID of the doctor's specialty
   *               qualification:
   *                 type: string
   *                 description: Doctor's qualifications
   *               experience:
   *                 type: integer
   *                 minimum: 0
   *                 description: Years of experience
   *               availableDays:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
   *     responses:
   *       201:
   *         description: Doctor created successfully
   *       400:
   *         description: Validation error
   *       409:
   *         description: Email already exists
   *       500:
   *         description: Server error
   */
  app.post("/api/doctors", async (req, res) => {
    try {
      const validatedData = insertDoctorSchema.parse({
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
      });
  
      // Check if email already exists
      if (validatedData.email) {
        const existingDoctor = await db.query.doctors.findFirst({
          where: eq(doctors.email, validatedData.email),
        });
  
        if (existingDoctor) {
          return res.status(409).json({ error: "A doctor with this email already exists" });
        }
      }
  
      // Create the doctor
      const [newDoctor] = await db
        .insert(doctors)
        .values(validatedData)
        .returning();
  
      // Return success response with the created doctor and its specialty
      const doctorWithSpecialty = await db.query.doctors.findFirst({
        where: eq(doctors.id, newDoctor.id),
        with: {
          specialty: true,
        },
      });
  
      res.status(201).json(doctorWithSpecialty);
    } catch (error: any) {
      console.error('Error creating doctor:', error);
  
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
  
      res.status(500).json({
        error: 'Failed to create doctor',
        details: error.message
      });
    }
  });
  /**
   * @swagger
   * /api/doctors/{id}:
   *   delete:
   *     summary: Delete a doctor
   *     description: Remove a doctor from the system
   *     tags: [Doctors]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Doctor ID
   *     responses:
   *       200:
   *         description: Doctor successfully deleted
   *       404:
   *         description: Doctor not found
   *       500:
   *         description: Server error
   */
  app.delete("/api/doctors/:id", async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
  
      // Check if the doctor exists
      const doctorExists = await db.query.doctors.findFirst({
        where: eq(doctors.id, doctorId),
      });
  
      if (!doctorExists) {
        return res.status(404).json({ error: "Doctor not found" });
      }
  
      // Delete doctor's appointments first
      await db.delete(appointments).where(eq(appointments.doctorId, doctorId));
  
      // Delete the doctor
      await db.delete(doctors).where(eq(doctors.id, doctorId));
  
      res.json({ message: "Doctor successfully deleted" });
    } catch (error: any) {
      console.error('Error deleting doctor:', error);
      res.status(500).json({
        error: 'Failed to delete doctor',
        details: error.message
      });
    }
  });
  /**
   * @swagger
   * /api/patients/{patientId}/symptom-journals:
   *   post:
   *     summary: Create a symptom journal entry with AI analysis
   *     tags: [Symptoms]
   *     parameters:
   *       - in: path
   *         name: patientId
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - symptoms
   *               - severity
   *               - mood
   *             properties:
   *               symptoms:
   *                 type: array
   *                 items:
   *                   type: string
   *               severity:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 10
   *               mood:
   *                 type: string
   *               notes:
   *                 type: string
   *     responses:
   *       201:
   *         description: Journal entry created with AI analysis
   */
  app.post("/api/patients/:patientId/symptom-journals", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);

      // Create journal entry
      const [journal] = await db
        .insert(symptomJournals)
        .values({
          ...req.body,
          patientId,
        })
        .returning();

      // Get patient's history for context
      const patientHistory = await db.query.symptomJournals.findMany({
        where: eq(symptomJournals.patientId, patientId),
        orderBy: [desc(symptomJournals.dateRecorded)],
        limit: 5,
      });

      // Generate AI analysis
      const prompt = {
        role: "system",
        content: "You are a medical analysis assistant. Analyze the symptom journal entry and previous history to provide insights and suggestions. Include pattern analysis, potential triggers, and recommended actions. Respond in JSON format with fields: analysis (string), sentiment (positive/negative/neutral), suggestedActions (array of strings), confidence (number between 0 and 1)"
      };

      const userMessage = {
        role: "user",
        content: `
Current Entry:
Symptoms: ${journal.symptoms.join(', ')}
Severity: ${journal.severity}/10
Mood: ${journal.mood}
Notes: ${journal.notes || 'None'}

Previous History:
${patientHistory.slice(1).map(h => `
Date: ${new Date(h.dateRecorded!).toLocaleDateString()}
Symptoms: ${h.symptoms?.join(', ')}
Severity: ${h.severity}/10
Mood: ${h.mood}
`).join('\n')}
`
      };

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [prompt, userMessage],
          temperature: 0.7,
          max_tokens: 500,
        });

        const aiResponse = JSON.parse(completion.choices[0].message.content);

        // Create analysis record
        const [analysis] = await db
          .insert(symptomAnalysis)
          .values({
            journalId: journal.id,
            analysis: aiResponse.analysis,
            sentiment: aiResponse.sentiment,
            suggestedActions: aiResponse.suggestedActions,
            aiConfidence: aiResponse.confidence,
          })
          .returning();

        // Return both journal and analysis
        const journalWithAnalysis = {
          ...journal,
          analysis: [analysis],
        };

        res.json(journalWithAnalysis);
      } catch (error) {
        console.error('Error generating AI analysis:', error);
        // Return the journal entry even if AI analysis fails
        res.json({
          ...journal,
          analysis: [{
            analysis: "Unable to generate AI analysis at this time.",
            sentiment: "neutral",
            suggestedActions: ["Please consult with your healthcare provider for a proper analysis."],
            aiConfidence: 0
          }]
        });
      }
    } catch (error: any) {
      console.error('Error creating symptom journal:', error);
      res.status(500).json({
        error: 'Failed to create symptom journal',
        details: error.message
      });
    }
  });

  /**
   * @swagger
   * /api/patients/{patientId}/symptom-journals:
   *   get:
   *     summary: Get patient's symptom journal entries with analysis
   *     tags: [Symptoms]
   *     parameters:
   *       - in: path
   *         name: patientId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: List of journal entries with analysis
   */
  app.get("/api/patients/:patientId/symptom-journals", async (req, res) => {
    try {
      const journals = await db.query.symptomJournals.findMany({
        where: eq(symptomJournals.patientId, parseInt(req.params.patientId)),
        orderBy: [desc(symptomJournals.dateRecorded)],
        with: {
          analysis: true,
        },
      });
      res.json(journals);
    } catch (error: any) {
      console.error("Error fetching symptom journals:", error);
      res.status(500).json({
        error: "Failed to fetch symptom journals",
        details: error.message,
      });
    }
  });
  /**
   * @swagger
   * /api/medical-documents/upload:
   *   post:
   *     summary: Upload a medical document
   *     tags: [Documents]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *               originalLanguage:
   *                 type: string
   *     responses:
   *       200:
   *         description: Document uploaded successfully
   */
    app.post("/api/medical-documents/upload", upload.single('file'), async (req, res) => {
      try {
        if (!req.file) {
          throw new Error('No file uploaded');
        }
  
        const [document] = await db
          .insert(medicalDocuments)
          .values({
            fileName: req.file.originalname,
            fileType: path.extname(req.file.originalname).slice(1),
            fileSize: req.file.size,
            originalLanguage: req.body.originalLanguage,
            secureUrl: req.file.path,
            status: "pending",
          })
          .returning();
  
        // Try to send email notification, but don't fail if it errors
        try {
          await sendEmail({
            to: document.uploadedBy ? (await db.query.doctors.findFirst({ where: eq(doctors.id, document.uploadedBy) }))?.email : process.env.ADMIN_EMAIL!,
            subject: "Medical Document Upload Confirmation",
            text: `A new medical document "${document.fileName}" has been uploaded and is ready for processing.`,
            html: `
              <h2>Medical Document Upload Confirmation</h2>
              <p>A new medical document has been uploaded to the system:</p>
              <ul>
                <li>File Name: ${document.fileName}</li>
                <li>Original Language: ${document.originalLanguage}</li>
                <li>Status: Pending Processing</li>
              </ul>
              <p>You will be notified when the document is ready for translation.</p>
            `,
          });
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          // Continue execution even if email fails
        }
  
        res.json(document);      } catch (error: any) {
        console.error("Error uploading document:", error);
        res.status(500).json({
          error: "Failed to upload document",
          details: error.message,
        });
      }
    });
  
  /**
   *   * @swagger
   * /api/medical-documents/translate:
   *   post:
   *     summary: Initiate document translation
   *     tags: [Documents]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - documentId
   *               - targetLanguage
   *             properties:
   *               documentId:
   *                 type: integer
   *               targetLanguage:
   *                 type: string
   *     responses:
   *       200:
   *         description: Translation initiated successfully
   */
  app.post("/api/medical-documents/translate", async (req, res) => {
    try {
      const { documentId, targetLanguage } = req.body;

      const document = await db.query.medicalDocuments.findFirst({
        where: eq(medicalDocuments.id, documentId),
        with: {
          uploader: true,
        },
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const [translation] = await db
        .insert(documentTranslations)
        .values({
          documentId,
          targetLanguage,
          status: "pending",
        })
        .returning();

      // Send email notification about translation initiation
      if (document.uploader?.email) {
        await sendEmail({
          to: document.uploader.email,
          subject: "Document Translation Initiated",
          text: `Translation of "${document.fileName}" to ${targetLanguage} has been initiated.`,
          html: `
            <h2>Document Translation Initiated</h2>
            <p>A translation has been initiated for your document:</p>
            <ul>
              <li>Document: ${document.fileName}</li>
              <li>From: ${document.originalLanguage}</li>
              <li>To: ${targetLanguage}</li>
            </ul>
            <p>You will be notified when the translation is complete.</p>
          `,
        });
      }

      res.json(translation);
    } catch (error: any) {
      console.error("Error initiating translation:", error);
      res.status(500).json({
        error: "Failed to initiate translation",
        details: error.message,
      });
    }
  });

  // Add a webhook endpoint for translation service to notify completion
  app.post("/api/medical-documents/translation-complete", async (req, res) => {
    try {
      const { translationId, success, translatedUrl, errorMessage } = req.body;

      const translation = await db.query.documentTranslations.findFirst({
        where: eq(documentTranslations.id, translationId),
        with: {
          document: {
            with: {
              uploader: true,
            },
          },
        },
      });

      if (!translation) {
        return res.status(404).json({ error: "Translation not found" });
      }

      // Update translation status
      await db
        .update(documentTranslations)
        .set({
          status: success ? "completed" : "error",
          translatedUrl: success ? translatedUrl : null,
          errorMessage: success ? null : errorMessage,
          completedAt: new Date(),
        })
        .where(eq(documentTranslations.id, translationId));

      // Send email notification
      if (translation.document?.uploader?.email) {
        await sendEmail({
          to: translation.document.uploader.email,
          subject: success ? "Document Translation Completed" : "Document Translation Failed",
          text: success
            ? `Translation of "${translation.document.fileName}" is complete.`
            : `Translation of "${translation.document.fileName}" failed: ${errorMessage}`,
          html: success
            ? `
              <h2>Document Translation Completed</h2>
              <p>The translation of your document has been completed:</p>
              <ul>
                <li>Document: ${translation.document.fileName}</li>
                <li>From: ${translation.document.originalLanguage}</li>
                <li>To: ${translation.targetLanguage}</li>
              </ul>
              <p>You can now access the translated document in the system.</p>
            `
            : `
              <h2>Document Translation Failed</h2>
              <p>Unfortunately, the translation of your document has failed:</p>
              <ul>
                <li>Document: ${translation.document.fileName}</li>
                <li>Error: ${errorMessage}</li>
              </ul>
              <p>Please try again or contact support if the issue persists.</p>
            `,
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error handling translation completion:", error);
      res.status(500).json({
        error: "Failed to process translation completion",
        details: error.message,
      });
    }
  });
  /**
   * @swagger
   * /api/medical-documents:
   *   get:
   *     summary: Get all medical documents
   *     tags: [Documents]
   *     responses:
   *       200:
   *         description: List of medical documents
   */
  app.get("/api/medical-documents", async (req, res) => {
    try {
      const documents = await db.query.medicalDocuments.findMany({
        orderBy: (medicalDocuments, { desc }) => [desc(medicalDocuments.createdAt)],
      });
      res.json(documents);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      res.status(500).json({
        error: "Failed to fetch documents",
        details: error.message,
      });
    }
  });
  /**
   * @swagger
   * /api/patients/{patientId}/health-report:
   *   get:
   *     summary: Generate health report
   *     description: Generate a comprehensive health report for a patient
   *     tags: [Patients]
   *     parameters:
   *       - in: path
   *         name: patientId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Patient ID
   *     responses:
   *       200:
   *         description: Patient health report data
   */
  app.get("/api/patients/:patientId/health-report", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);

      // Get patient information
      const patient = await db.query.patients.findFirst({
        where: eq(patients.id, patientId),
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // Get recent appointments
      const recentAppointments = await db.query.appointments.findMany({
        where: eq(appointments.patientId, patientId),
        orderBy: (appointments, { desc }) => [desc(appointments.date)],
        limit: 5,
        with: {
          doctor: {
            with: {
              specialty: true,
            },
          },
        },
      });

      // Get symptom journals
      const symptomJournals = await db.query.symptomJournals.findMany({
        where: eq(symptomJournals.patientId, patientId),
        orderBy: (journals, { desc }) => [desc(journals.dateRecorded)],
        with: {
          analysis: true,
        },
      });

      // Compile the report data
      const reportData = {
        patient: {
          name: patient.name,
          dateOfBirth: patient.dateOfBirth,
          healthConditions: patient.healthConditions,
          medications: patient.medications,
          allergies: patient.allergies,
        },
        appointments: recentAppointments,
        symptomJournals,
        generatedDate: new Date(),
      };

      res.json(reportData);
    } catch (error: any) {
      console.error("Error generating health report:", error);
      res.status(500).json({
        error: "Failed to generate health report",
        details: error.message,
      });
    }
  });
  function getTimeSlot(date: Date): string {
    const hour = date.getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
  const httpServer = createServer(app);
    return httpServer;
}
const insertDoctorSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  specialtyId: z.number().int().optional(),
  qualification: z.string().optional(),
  experience: z.number().int().min(0).optional(),
  availableDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional(),
  startDate: z.date().nullable().optional()
});