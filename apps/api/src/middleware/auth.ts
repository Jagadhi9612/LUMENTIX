import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type SessionUser = {
  id: string;
  role: "SUPER_ADMIN" | "GYM_MANAGER" | "RECEPTIONIST" | "TRAINER" | "ACCOUNTANT";
  gymId: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET ?? "dev-secret") as SessionUser;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function authorize(roles: SessionUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}
