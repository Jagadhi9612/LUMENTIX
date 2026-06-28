import type { NextFunction, Request, Response } from "express";
import { prisma } from "@elite/db";

export function auditLog() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (data: unknown) {
      if (req.user && shouldAudit(req.method, req.path)) {
        prisma.auditLog
          .create({
            data: {
              userId: req.user.id,
              action: `${req.method} ${req.path}`,
              resource: extractResource(req.path),
              resourceId: extractResourceId(req.body),
              status: res.statusCode < 400 ? "SUCCESS" : "FAILURE",
              details: JSON.stringify({
                method: req.method,
                path: req.path,
                query: req.query,
                statusCode: res.statusCode
              }),
              timestamp: new Date(),
              gymId: req.user.gymId
            }
          })
          .catch((error) => {
            console.error("Failed to log audit:", error);
          });
      }

      return originalJson(data);
    };

    next();
  };
}

function shouldAudit(method: string, path: string): boolean {
  return ["POST", "PUT", "DELETE", "PATCH"].includes(method);
}

function extractResource(path: string): string {
  const match = path.match(/\/api\/v\d+\/(\w+)/);
  return match ? match[1] : "unknown";
}

function extractResourceId(body: unknown): string | undefined {
  if (typeof body === "object" && body !== null && "id" in body) {
    return (body as Record<string, unknown>).id as string;
  }
  return undefined;
}
