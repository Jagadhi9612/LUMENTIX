// apps/mobile/src/services/aiCodexService.ts

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

interface HealthData {
  heartRate: number;
  sleepHours: number;
  activityType: string;
  metricsText?: string;
}

export const analyzeHealthWithCodex = async (data: HealthData): Promise<string> => {
  try {
    const prompt = data.metricsText
      ? `You are an expert AI fitness trainer inside Elite Fitness app.
         Member metrics: ${data.metricsText}
         Give ONE specific personalized health insight. Max 3 sentences.`
      : `Heart Rate: ${data.heartRate} BPM, Sleep: ${data.sleepHours}h. Give brief fitness advice.`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    if (result.candidates?.[0]) {
      return result.candidates[0].content.parts[0].text;
    }
    return "AI insight unavailable.";

  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Unable to get AI insight right now.";
  }
};