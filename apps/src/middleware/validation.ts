import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { ZodError } from "zod";
import { AppError } from "./errors.ts";

// ─── Async Handler ────────────────────────────────────────────────────────────
// Wraps an async route handler so rejected promises are forwarded to next(err)
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// ─── Zod Validation Middleware ────────────────────────────────────────────────
export type ValidationSource = "body" | "params" | "query";

export const validate =
  (schema: ZodSchema, source: ValidationSource = "body"): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const data = source === "body" ? req.body : source === "params" ? req.params : req.query;
    const result = schema.safeParse(data);

    if (!result.success) {
      next(result.error); // forward ZodError to global handler
      return;
    }

    if (source === "body") {
      req.body = result.data;
    } else if (source === "params") {
      req.params = result.data;
    } else {
      req.query = result.data;
    }

    next();
  };

// ─── Global Error Handler ─────────────────────────────────────────────────────
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Known application errors → custom status
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
    });
    return;
  }

  // Unexpected errors → 500
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message || "An unexpected error occurred",
  });
};
