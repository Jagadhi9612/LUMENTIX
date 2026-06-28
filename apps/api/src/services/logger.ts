import winston from "winston";
import { config } from "../config.js";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white"
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: config.logging.filePath,
    level: "error",
    format: format
  }),
  new winston.transports.File({
    filename: config.logging.filePath,
    format: format
  })
];

export const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format,
  transports
});

export interface LogContext {
  userId?: string;
  gymId?: string;
  requestId?: string;
  action?: string;
  resource?: string;
}

export function logRequest(method: string, path: string, statusCode: number, context: LogContext = {}) {
  const message = `${method} ${path} - ${statusCode}`;
  const logData = { ...context, message };

  if (statusCode >= 500) {
    logger.error(JSON.stringify(logData));
  } else if (statusCode >= 400) {
    logger.warn(JSON.stringify(logData));
  } else {
    logger.info(JSON.stringify(logData));
  }
}

export function logError(error: Error, context: LogContext = {}) {
  logger.error(JSON.stringify({ error: error.message, stack: error.stack, ...context }));
}

export function logDatabaseOperation(operation: string, table: string, duration: number, context: LogContext = {}) {
  const message = `DB ${operation} on ${table} took ${duration}ms`;
  logger.debug(JSON.stringify({ message, ...context }));
}

export function logPayment(status: string, amount: number, memberId: string, context: LogContext = {}) {
  const message = `Payment ${status} - ₹${amount} from member ${memberId}`;
  logger.info(JSON.stringify({ message, ...context }));
}

export function logSecurityEvent(event: string, details: Record<string, unknown>, context: LogContext = {}) {
  const message = `Security Event: ${event}`;
  logger.warn(JSON.stringify({ message, details, ...context }));
}
