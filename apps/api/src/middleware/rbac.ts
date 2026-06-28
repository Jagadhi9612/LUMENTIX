import type { NextFunction, Request, Response } from "express";
import type { SessionUser } from "./auth.js";

export type Permission =
  | "members:read"
  | "members:create"
  | "members:update"
  | "members:delete"
  | "packages:read"
  | "packages:create"
  | "packages:update"
  | "packages:delete"
  | "payments:read"
  | "payments:create"
  | "attendance:read"
  | "attendance:create"
  | "trainers:read"
  | "trainers:create"
  | "trainers:update"
  | "trainers:delete"
  | "expenses:read"
  | "expenses:create"
  | "expenses:update"
  | "expenses:delete"
  | "dashboard:read"
  | "settings:read"
  | "settings:update"
  | "audit:read"
  | "staff:manage";

const rolePermissions: Record<SessionUser["role"], Permission[]> = {
  SUPER_ADMIN: [
    "members:read",
    "members:create",
    "members:update",
    "members:delete",
    "packages:read",
    "packages:create",
    "packages:update",
    "packages:delete",
    "payments:read",
    "payments:create",
    "attendance:read",
    "attendance:create",
    "trainers:read",
    "trainers:create",
    "trainers:update",
    "trainers:delete",
    "expenses:read",
    "expenses:create",
    "expenses:update",
    "expenses:delete",
    "dashboard:read",
    "settings:read",
    "settings:update",
    "audit:read",
    "staff:manage"
  ],
  GYM_MANAGER: [
    "members:read",
    "members:create",
    "members:update",
    "packages:read",
    "packages:create",
    "packages:update",
    "payments:read",
    "payments:create",
    "attendance:read",
    "trainers:read",
    "trainers:create",
    "trainers:update",
    "expenses:read",
    "expenses:create",
    "expenses:update",
    "dashboard:read",
    "settings:read",
    "audit:read"
  ],
  RECEPTIONIST: [
    "members:read",
    "members:create",
    "members:update",
    "packages:read",
    "payments:read",
    "payments:create",
    "attendance:read",
    "attendance:create",
    "trainers:read",
    "dashboard:read"
  ],
  TRAINER: [
    "members:read",
    "attendance:read",
    "attendance:create",
    "dashboard:read"
  ],
  ACCOUNTANT: [
    "payments:read",
    "payments:create",
    "expenses:read",
    "expenses:create",
    "expenses:update",
    "dashboard:read",
    "audit:read"
  ]
};

export function checkPermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const userPermissions = rolePermissions[req.user.role];
    if (!userPermissions.includes(permission)) {
      res.status(403).json({ message: `Permission denied: ${permission}` });
      return;
    }

    next();
  };
}

export function getPermissions(role: SessionUser["role"]): Permission[] {
  return rolePermissions[role] || [];
}
