import { Router } from "express";
import { z } from "zod";
import { prisma } from "@elite/db";
import { authenticate } from "../middleware/auth.js";
import { checkPermission } from "../middleware/rbac.js";
import { getPagination } from "../lib/pagination.js";

export const paymentsRouter = Router();

const paymentSchema = z.object({
  memberId: z.string(),
  amount: z.number().positive(),
  packageId: z.string().optional(),
  description: z.string().optional(),
  method: z.enum(["CARD", "CASH", "CHECK", "UPI", "NET_BANKING"])
});

const refundSchema = z.object({
  reason: z.string()
});

paymentsRouter.get(
  "/",
  authenticate,
  checkPermission("payments:read"),
  async (req, res, next) => {
    try {
      const { page, limit, skip } = getPagination(req.query);
      const [items, total] = await Promise.all([
        prisma.payment.findMany({
          where: { gymId: req.user!.gymId },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { member: true, package: true }
        }),
        prisma.payment.count({ where: { gymId: req.user!.gymId } })
      ]);

      res.json({ items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
      next(error);
    }
  }
);

paymentsRouter.post(
  "/",
  authenticate,
  checkPermission("payments:create"),
  async (req, res, next) => {
    try {
      const data = paymentSchema.parse(req.body);

      const payment = await prisma.payment.create({
        data: {
          ...data,
          gymId: req.user!.gymId,
          status: data.method === "CARD" ? "PENDING" : "COMPLETED",
          paidAt: data.method === "CARD" ? null : new Date(),
          transactionId: `TXN-${Date.now()}`,
          paymentGateway: data.method === "CARD" ? "STRIPE" : "MANUAL"
        },
        include: { member: true, package: true }
      });

      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  }
);

paymentsRouter.post(
  "/:id/refund",
  authenticate,
  checkPermission("payments:create"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = refundSchema.parse(req.body);

      const payment = await prisma.payment.findUnique({ where: { id } });
      if (!payment) {
        res.status(404).json({ message: "Payment not found" });
        return;
      }

      if (payment.status === "REFUNDED") {
        res.status(400).json({ message: "Payment already refunded" });
        return;
      }

      const refundedPayment = await prisma.payment.update({
        where: { id },
        data: {
          status: "REFUNDED",
          refundedAt: new Date(),
          refundReason: reason
        }
      });

      res.json(refundedPayment);
    } catch (error) {
      next(error);
    }
  }
);

paymentsRouter.get(
  "/:id",
  authenticate,
  checkPermission("payments:read"),
  async (req, res, next) => {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: req.params.id },
        include: { member: true, package: true }
      });

      if (!payment) {
        res.status(404).json({ message: "Payment not found" });
        return;
      }

      res.json(payment);
    } catch (error) {
      next(error);
    }
  }
);
