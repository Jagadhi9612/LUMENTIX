import { prisma } from "@elite/db";
import { Router } from "express";

export const dashboardRouter = Router();

dashboardRouter.get("/overview", async (_req, res, next) => {
  try {
    const [members, payments, expenses, packages, trainers] = await Promise.all([
      prisma.member.groupBy({ by: ["status"], _count: true }),
      prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { member: true } }),
      prisma.expense.findMany({ orderBy: { spentAt: "desc" }, take: 12 }),
      prisma.membershipPackage.findMany({ where: { isActive: true }, orderBy: { price: "desc" } }),
      prisma.trainer.findMany({ orderBy: { name: "asc" } })
    ]);

    const revenue = payments.reduce((sum, payment) => sum + Number(payment.paidAmount), 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    res.json({
      metrics: {
        revenue,
        expenses: expenseTotal,
        profit: revenue - expenseTotal,
        activeMembers: members.find((item) => item.status === "ACTIVE")?._count ?? 0,
        expiredMembers: members.find((item) => item.status === "EXPIRED")?._count ?? 0,
        packagesSold: payments.length,
        trainers: trainers.length
      },
      recentPayments: payments.map((payment) => ({
        id: payment.id,
        invoiceNumber: payment.invoiceNumber,
        memberName: payment.member.fullName,
        amount: Number(payment.paidAmount),
        status: payment.status,
        paidAt: payment.paidAt
      })),
      packages: packages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        price: Number(pkg.price),
        durationDays: pkg.durationDays,
        badge: pkg.badge
      })),
      trainers
    });
  } catch (error) {
    next(error);
  }
});
