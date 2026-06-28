import { Router } from "express";
import { z } from "zod";
import { prisma } from "@elite/db";
import { authenticate } from "../middleware/auth.js";
import { checkPermission } from "../middleware/rbac.js";
import { getPagination } from "../lib/pagination.js";

export const expensesRouter = Router();

const expenseSchema = z.object({
  category: z.enum(["EQUIPMENT", "UTILITIES", "STAFF", "MAINTENANCE", "SUPPLIES", "OTHER"]),
  description: z.string().min(3),
  amount: z.number().positive(),
  date: z.coerce.date(),
  vendor: z.string().optional(),
  receipt: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional()
});

expensesRouter.get(
  "/",
  authenticate,
  checkPermission("expenses:read"),
  async (req, res, next) => {
    try {
      const { page, limit, skip } = getPagination(req.query);
      const category = req.query.category as string | undefined;

      const where = {
        gymId: req.user!.gymId,
        ...(category && { category })
      };

      const [items, total] = await Promise.all([
        prisma.expense.findMany({
          where,
          skip,
          take: limit,
          orderBy: { date: "desc" }
        }),
        prisma.expense.count({ where })
      ]);

      res.json({ items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
      next(error);
    }
  }
);

expensesRouter.post(
  "/",
  authenticate,
  checkPermission("expenses:create"),
  async (req, res, next) => {
    try {
      const data = expenseSchema.parse(req.body);

      const expense = await prisma.expense.create({
        data: {
          ...data,
          gymId: req.user!.gymId,
          createdBy: req.user!.id,
          status: data.status ?? "PENDING"
        }
      });

      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  }
);

expensesRouter.put(
  "/:id",
  authenticate,
  checkPermission("expenses:update"),
  async (req, res, next) => {
    try {
      const data = expenseSchema.partial().parse(req.body);

      const expense = await prisma.expense.update({
        where: { id: req.params.id },
        data
      });

      res.json(expense);
    } catch (error) {
      next(error);
    }
  }
);

expensesRouter.post(
  "/:id/approve",
  authenticate,
  checkPermission("expenses:update"),
  async (req, res, next) => {
    try {
      const expense = await prisma.expense.update({
        where: { id: req.params.id },
        data: {
          status: "APPROVED",
          approvedBy: req.user!.id,
          approvedAt: new Date()
        }
      });

      res.json(expense);
    } catch (error) {
      next(error);
    }
  }
);

expensesRouter.post(
  "/:id/reject",
  authenticate,
  checkPermission("expenses:update"),
  async (req, res, next) => {
    try {
      const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);

      const expense = await prisma.expense.update({
        where: { id: req.params.id },
        data: {
          status: "REJECTED",
          rejectionReason: reason
        }
      });

      res.json(expense);
    } catch (error) {
      next(error);
    }
  }
);

expensesRouter.get(
  "/analytics/summary",
  authenticate,
  checkPermission("expenses:read"),
  async (req, res, next) => {
    try {
      const expenses = await prisma.expense.findMany({
        where: { gymId: req.user!.gymId, status: "APPROVED" }
      });

      const byCategory = expenses.reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        },
        {} as Record<string, number>
      );

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      const average = expenses.length > 0 ? total / expenses.length : 0;

      res.json({
        total,
        average,
        count: expenses.length,
        byCategory
      });
    } catch (error) {
      next(error);
    }
  }
);
