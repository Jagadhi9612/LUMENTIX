import "dotenv/config";
import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { auditLog } from "./middleware/audit.js";
import { authenticate } from "./middleware/auth.js";
import { initializeEmailService } from "./services/email.js";
import { initializeSmsService } from "./services/sms.js";
import { initializeScheduler } from "./services/scheduler.js";
import { dashboardRouter } from "./modules/dashboard.js";
import { membersRouter } from "./modules/members.js";
import { packagesRouter } from "./modules/packages.js";
import { paymentsRouter } from "./modules/payments.js";
import { trainersRouter } from "./modules/trainers.js";
import { expensesRouter } from "./modules/expenses.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(auditLog());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "elite-fitness-api", timestamp: new Date().toISOString() });
});

app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/members", membersRouter);
app.use("/api/v1/packages", packagesRouter);
app.use("/api/v1/payments", paymentsRouter);
app.use("/api/v1/trainers", trainersRouter);
app.use("/api/v1/expenses", expensesRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    res.status(422).json({ message: "Validation failed", issues: error.issues });
    return;
  }

  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  initializeEmailService();
  initializeSmsService();
  initializeScheduler();
  console.log(`ELITE FITNESS API listening on http://localhost:${port}`);
});
