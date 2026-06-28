import { prisma } from "@elite/db";
import { Router } from "express";
import { z } from "zod";

export const packagesRouter = Router();

const packageSchema = z.object({
  name: z.string().min(2),
  durationDays: z.number().int().positive(),
  price: z.number().positive(),
  discountPercent: z.number().min(0).max(100).default(0),
  gstPercent: z.number().min(0).max(100).default(18),
  description: z.string().min(10),
  facilities: z.array(z.string()).default([]),
  personalTrainingSessions: z.number().int().min(0).default(0),
  freezeDays: z.number().int().min(0).default(0),
  color: z.string().default("#E10600"),
  badge: z.string().optional()
});

packagesRouter.get("/", async (_req, res, next) => {
  try {
    const packages = await prisma.membershipPackage.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" }
    });

    res.json({ items: packages });
  } catch (error) {
    next(error);
  }
});

packagesRouter.post("/", async (req, res, next) => {
  try {
    const data = packageSchema.parse(req.body);
    const created = await prisma.membershipPackage.create({
      data: {
        ...data,
        gymId: "elite-hq"
      }
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});
