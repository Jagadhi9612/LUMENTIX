import { Router } from "express";
import { z } from "zod";
import { prisma } from "@elite/db";
import { authenticate } from "../middleware/auth.js";
import { checkPermission } from "../middleware/rbac.js";
import { getPagination } from "../lib/pagination.js";

export const trainersRouter = Router();

const trainerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  specialization: z.string().min(2),
  certifications: z.array(z.string()).optional(),
  experience: z.number().int().positive(),
  joinDate: z.coerce.date(),
  shift: z.enum(["MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"])
});

const scheduleSchema = z.object({
  trainerId: z.string(),
  memberId: z.string(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string(),
  endTime: z.string(),
  sessionType: z.string().optional()
});

trainersRouter.get(
  "/",
  authenticate,
  checkPermission("trainers:read"),
  async (req, res, next) => {
    try {
      const { page, limit, skip } = getPagination(req.query);
      const [items, total] = await Promise.all([
        prisma.trainer.findMany({
          where: { gymId: req.user!.gymId },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { members: true } } }
        }),
        prisma.trainer.count({ where: { gymId: req.user!.gymId } })
      ]);

      res.json({ items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
      next(error);
    }
  }
);

trainersRouter.post(
  "/",
  authenticate,
  checkPermission("trainers:create"),
  async (req, res, next) => {
    try {
      const data = trainerSchema.parse(req.body);

      const trainer = await prisma.trainer.create({
        data: {
          ...data,
          gymId: req.user!.gymId,
          status: "ACTIVE"
        }
      });

      res.status(201).json(trainer);
    } catch (error) {
      next(error);
    }
  }
);

trainersRouter.post(
  "/:id/assign",
  authenticate,
  checkPermission("trainers:update"),
  async (req, res, next) => {
    try {
      const { trainerId, memberId } = z.object({ trainerId: z.string(), memberId: z.string() }).parse(req.body);

      const trainer = await prisma.trainer.findUnique({
        where: { id: trainerId }
      });

      if (!trainer) {
        res.status(404).json({ message: "Trainer not found" });
        return;
      }

      const member = await prisma.member.update({
        where: { id: memberId },
        data: { trainerId },
        include: { trainer: true }
      });

      res.json(member);
    } catch (error) {
      next(error);
    }
  }
);

trainersRouter.get(
  "/:id/schedule",
  authenticate,
  checkPermission("trainers:read"),
  async (req, res, next) => {
    try {
      const schedule = await prisma.trainerSchedule.findMany({
        where: { trainerId: req.params.id },
        include: { member: true }
      });

      res.json(schedule);
    } catch (error) {
      next(error);
    }
  }
);

trainersRouter.post(
  "/:id/schedule",
  authenticate,
  checkPermission("trainers:update"),
  async (req, res, next) => {
    try {
      const data = scheduleSchema.parse(req.body);

      const schedule = await prisma.trainerSchedule.create({
        data: {
          ...data,
          gymId: req.user!.gymId
        }
      });

      res.status(201).json(schedule);
    } catch (error) {
      next(error);
    }
  }
);

trainersRouter.get(
  "/:id",
  authenticate,
  checkPermission("trainers:read"),
  async (req, res, next) => {
    try {
      const trainer = await prisma.trainer.findUnique({
        where: { id: req.params.id },
        include: { members: true }
      });

      if (!trainer) {
        res.status(404).json({ message: "Trainer not found" });
        return;
      }

      res.json(trainer);
    } catch (error) {
      next(error);
    }
  }
);

trainersRouter.put(
  "/:id",
  authenticate,
  checkPermission("trainers:update"),
  async (req, res, next) => {
    try {
      const data = trainerSchema.partial().parse(req.body);

      const trainer = await prisma.trainer.update({
        where: { id: req.params.id },
        data
      });

      res.json(trainer);
    } catch (error) {
      next(error);
    }
  }
);
