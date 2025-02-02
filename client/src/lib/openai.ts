import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY });

interface ActionRecommendation {
  title: string;
  description: string;
  icon: string;
  href: string;
  priority: number;
}

interface RecommendationResponse {
  actions: ActionRecommendation[];
}

export async function getSmartRecommendations(
  role: string,
  recentActivities: string[]
): Promise<RecommendationResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a medical workflow assistant helping healthcare professionals with task recommendations. 
          Generate personalized quick actions based on the user's role and recent activities.
          Return a JSON object with an 'actions' array containing recommended tasks.
          Each action should have: title, description, icon (one of: UserPlus, CalendarPlus, ClipboardList, FileSearch, Phone), href, and priority (1-5).`
        },
        {
          role: "user",
          content: `Generate 3-5 personalized quick actions for a ${role} based on these recent activities: ${recentActivities.join(", ")}`
        }
      ],
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) as RecommendationResponse : { actions: [] };
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    return { actions: [] };
  }
}