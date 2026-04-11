import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { errorResponse } from "../utils/apiResponse";

function mapPrismaError(err: Error): { status: number; message: string } | null {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return { status: 503, message: "Service temporarily unavailable. Please try again in a moment." };
  }
  if (err instanceof Prisma.PrismaClientRustPanicError) {
    return { status: 503, message: "Service temporarily unavailable. Please try again in a moment." };
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return { status: 409, message: "This record already exists." };
      case "P2025":
        return { status: 404, message: "Requested record was not found." };
      default:
        return { status: 400, message: "We couldn't complete that request. Please try again." };
    }
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    // Database connectivity / network errors throw here.
    return { status: 503, message: "Service temporarily unavailable. Please try again in a moment." };
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, message: "Invalid request data." };
  }
  return null;
}

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

  const prismaMapped = mapPrismaError(err);
  if (prismaMapped) {
    res.status(prismaMapped.status).json(errorResponse(prismaMapped.message));
    return;
  }

  const status = (err as any).status || 500;
  const message =
    status >= 500
      ? "Something went wrong on our side. Please try again."
      : err.message || "Request failed";

  res.status(status).json(errorResponse(message));
}
