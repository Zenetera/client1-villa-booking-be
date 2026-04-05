import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { errorResponse } from "../utils/apiResponse";

export interface AuthRequest extends Request {}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json(errorResponse("Authentication required"));
    return;
  }

  const token = header.slice(7);

  try {
    jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json(errorResponse("Invalid or expired token"));
  }
}
