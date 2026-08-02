import { onRequest } from "firebase-functions/v2/https";
import { generateDietPlan } from "./gemini.js";

export const generateDietPlanApi = onRequest(
  {
    cors: true,
    invoker: "public",
  },
  async (request, response) => {
    try {
      const { age, gender, height, weight, goal } = request.body;

      if (!age || !gender || !height || !weight || !goal) {
        response.status(400).json({
        success: false,
        message: "Missing required fields",
        });
        return;
      }

      const diet = await generateDietPlan({
        age,
        gender,
        height,
        weight,
        goal,
      });

    response.status(200).json({
    success: true,
    diet,
    });
    return;
    } catch (error) {
      console.error("Diet API Error:", error);

    response.status(500).json({
    success: false,
    message: "Unable to generate diet plan",
    });
    return;
    }
  }
);