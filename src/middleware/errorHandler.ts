import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { errorResponse } from "../utils/apiResponse";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({ errors });
    return;
  }

  console.error("Unhandled error:", err);

  const status = (err as any).status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(status).json(errorResponse(message));
}
