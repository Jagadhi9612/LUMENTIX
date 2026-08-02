import { GoogleGenAI } from "@google/genai";
import { buildDietPrompt, type DietProfile } from "./prompt.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function generateDietPlan(profile: DietProfile) {
  try {
    const prompt = buildDietPrompt(profile);

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate diet plan");
  }
}