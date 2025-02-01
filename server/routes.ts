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
  symptomAnalysis
} from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { sendEmail, generateAppointmentEmail } from "./lib/email";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import OpenAI from "openai";

const openai = new OpenAI();

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

      // Only attempt AI analysis if OpenAI API key is available
      if (process.env.OPENAI_API_KEY) {
        try {
          // Get comprehensive patient history for better personalization
          const [patientDetails] = await db
            .select()
            .from(patients)
            .where(eq(patients.id, patientId))
            .limit(1);

          // Get recent symptom history with analysis
          const patientHistory = await db.query.symptomJournals.findMany({
            where: eq(symptomJournals.patientId, patientId),
            orderBy: [desc(symptomJournals.dateRecorded)],
            limit: 10,
            with: {
              analysis: true,
            },
          });

          // Extract patterns and trends from history
          const historicalPatterns = patientHistory.reduce((acc, entry) => {
            entry.symptoms?.forEach(symptom => {
              if (!acc[symptom]) {
                acc[symptom] = {
                  count: 0,
                  avgSeverity: 0,
                  commonMoods: new Set(),
                  effectiveness: [] // Track which suggestions helped
                };
              }
              acc[symptom].count++;
              acc[symptom].avgSeverity += entry.severity;
              acc[symptom].commonMoods.add(entry.mood);

              // Track which suggestions were effective
              entry.analysis?.forEach(analysis => {
                if (analysis.suggestedActions) {
                  acc[symptom].effectiveness.push({
                    actions: analysis.suggestedActions,
                    nextSeverity: patientHistory.find(h => 
                      h.dateRecorded > entry.dateRecorded
                    )?.severity || entry.severity
                  });
                }
              });
            });
            return acc;
          }, {} as Record<string, {
            count: number;
            avgSeverity: number;
            commonMoods: Set<string>;
            effectiveness: Array<{
              actions: string[];
              nextSeverity: number;
            }>;
          }>);

          // Generate personalized prompt based on history
          const prompt = {
            role: "system",
            content: `You are an advanced medical analysis assistant specializing in personalized healthcare insights.
Analyze the patient's symptom patterns and provide highly personalized recommendations.

Key Patient Information:
- Health Conditions: ${patientDetails.healthConditions?.join(', ') || 'None recorded'}
- Medications: ${patientDetails.medications?.join(', ') || 'None recorded'}
- Allergies: ${patientDetails.allergies?.join(', ') || 'None recorded'}
- Chronic Conditions: ${patientDetails.chronicConditions?.join(', ') || 'None recorded'}

Historical Pattern Analysis:
${Object.entries(historicalPatterns).map(([symptom, data]) => `
${symptom}:
- Frequency: ${data.count} occurrences
- Average Severity: ${(data.avgSeverity / data.count).toFixed(1)}
- Common Moods: ${Array.from(data.commonMoods).join(', ')}
- Most Effective Actions: ${data.effectiveness
  .filter(e => e.nextSeverity < e.actions.length)
  .map(e => e.actions)
  .flat()
  .slice(0, 3)
  .join(', ')}
`).join('\n')}

Recent History:
${patientHistory.map(h => `
Date: ${h.dateRecorded}
Symptoms: ${h.symptoms?.join(", ") || "None"}
Severity: ${h.severity}
Mood: ${h.mood}
`).join("\n")}

Provide analysis in JSON format with fields:
- analysis (string): Detailed analysis incorporating historical patterns
- sentiment (positive/negative/neutral): Overall health trajectory
- suggestedActions (array of strings): Personalized recommendations based on what has worked before
- confidence (number between 0 and 1): Confidence in the analysis
- trends (object): {
    pattern: string (identified pattern),
    triggers: array of strings (potential triggers),
    improvements: array of strings (areas showing improvement),
    concerns: array of strings (areas needing attention)
  }`
          };

          const userMessage = {
            role: "user",
            content: `
Current Entry:
Symptoms: ${req.body.symptoms.join(", ")}
Severity: ${req.body.severity}
Mood: ${req.body.mood}
Notes: ${req.body.notes || "None"}

Compare this with historical patterns and provide personalized insights.`
          };

          const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [prompt, userMessage],
            response_format: { type: "json_object" },
          });


          const analysis = JSON.parse(response.choices[0].message.content || "{}");

          // Save enhanced AI analysis
          const [savedAnalysis] = await db
            .insert(symptomAnalysis)
            .values({
              journalId: journal.id,
              analysis: analysis.analysis,
              sentiment: analysis.sentiment,
              suggestedActions: analysis.suggestedActions,
              aiConfidence: analysis.confidence,
              // Add additional analysis data as JSON in the analysis field
              details: JSON.stringify({
                trends: analysis.trends,
                historicalPatterns
              })
            })
            .returning();

          return res.status(201).json({
            journal,
            analysis: savedAnalysis,
          });
        } catch (aiError) {
          console.error("AI analysis failed:", aiError);
          return res.status(201).json({
            journal,
            analysis: null,
          });
        }
      }

      // Return journal without analysis if no OpenAI API key
      res.status(201).json({
        journal,
        analysis: null,
      });
    } catch (error: any) {
      console.error("Error creating symptom journal:", error);
      res.status(500).json({
        error: "Failed to create symptom journal",
        details: error.message,
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