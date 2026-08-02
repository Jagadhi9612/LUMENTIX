import "dotenv/config";
import express from "express";
import cors from "cors";
import { generateDietPlan } from "./ai/gemini.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/v1/diet", async (req, res) => {
  try {
    const { age, gender, height, weight, goal } = req.body;

    if (!age || !gender || !height || !weight || !goal) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const diet = await generateDietPlan({
      age,
      gender,
      height,
      weight,
      goal,
    });

    res.json({
      success: true,
      diet,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to generate diet plan",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Diet API running on http://localhost:${PORT}`);
});