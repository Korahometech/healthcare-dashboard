import { Router } from "express";
import { db } from "@db";
import { patients, labResults, healthGoals, biomarkerData } from "@db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateRecommendations(patientData: any) {
  const prompt = `As a healthcare expert, analyze the following patient data and provide 3-5 personalized health recommendations. Focus on actionable lifestyle changes and preventive measures. Format the response in JSON with an array of recommendations, each containing 'title' and 'description'.

Patient Data:
${JSON.stringify(patientData, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}

router.get("/api/recommendations/:patientId", async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);

    // Fetch comprehensive patient data
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Fetch additional health data
    const patientLabResults = await db
      .select()
      .from(labResults)
      .where(eq(labResults.patientId, patientId));

    const patientBiomarkers = await db
      .select()
      .from(biomarkerData)
      .where(eq(biomarkerData.patientId, patientId));

    const patientGoals = await db
      .select()
      .from(healthGoals)
      .where(eq(healthGoals.carePlanId, patientId));

    // Combine all patient data
    const fullPatientData = {
      ...patient,
      labResults: patientLabResults,
      biomarkers: patientBiomarkers,
      healthGoals: patientGoals,
    };

    // Generate recommendations
    const recommendations = await generateRecommendations(fullPatientData);
    res.json(recommendations);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

export default router;