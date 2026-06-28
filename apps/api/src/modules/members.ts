import { prisma } from "@elite/db";
import { Router } from "express";
import { z } from "zod";
import { getPagination } from "../lib/pagination.js";

export const membersRouter = Router();

const memberSchema = z.object({
  fullName: z.string().min(2),
  gender: z.string().min(2),
  dateOfBirth: z.coerce.date(),
  phone: z.string().min(8),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  pin: z.string().min(4),
  emergencyContact: z.string().min(8),
  occupation: z.string().optional(),
  bloodGroup: z.string().optional(),
  packageId: z.string().optional(),
  trainerId: z.string().optional(),
  membershipStart: z.coerce.date(),
  membershipEnd: z.coerce.date()
});

membersRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip, search, sortBy, sortOrder } = getPagination(req.query);
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
            { memberCode: { contains: search, mode: "insensitive" as const } }
          ]
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        include: { package: true, trainer: true }
      }),
      prisma.member.count({ where })
    ]);

    res.json({ items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

membersRouter.post("/", async (req, res, next) => {
  try {
    const data = memberSchema.parse(req.body);
    const count = await prisma.member.count();
    const memberCode = `ELT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const member = await prisma.member.create({
      data: {
        ...data,
        gymId: "elite-hq",
        memberCode,
        joiningDate: new Date(),
        qrCode: memberCode,
        barcode: `89${String(Date.now()).slice(-10)}`,
        status: "ACTIVE"
      }
    });

    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
});
