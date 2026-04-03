import { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import * as blockedDateService from "../services/blockedDate.service";
import { BlockedDateError } from "../services/blockedDate.service";
import {
  createBlockedDateSchema,
  blockedDateQuerySchema,
} from "../validators/blockedDate.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";
import prisma from "../config/database";

async function getVillaId(): Promise<number | null> {
  const villa = await prisma.villa.findFirst({ select: { id: true } });
  return villa?.id ?? null;
}

export async function listBlockedDates(req: AuthRequest, res: Response) {
  const query = blockedDateQuerySchema.parse(req.query);

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const blockedDates = await blockedDateService.listBlockedDates(villaId, query);
  res.json(successResponse(blockedDates));
}

export async function createBlockedDates(req: AuthRequest, res: Response) {
  const input = createBlockedDateSchema.parse(req.body);

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  try {
    const result = await blockedDateService.createBlockedDates(villaId, input);
    res.status(201).json(successResponse(result));
  } catch (err) {
    if (err instanceof BlockedDateError) {
      res.status(400).json(errorResponse(err.message, err.field));
      return;
    }
    throw err;
  }
}

export async function deleteBlockedDate(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json(errorResponse("Invalid blocked date ID", "id"));
    return;
  }

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  try {
    const deleted = await blockedDateService.deleteBlockedDate(id, villaId);
    if (!deleted) {
      res.status(404).json(errorResponse("Blocked date not found"));
      return;
    }
    res.json(successResponse(deleted));
  } catch (err) {
    if (err instanceof BlockedDateError) {
      res.status(400).json(errorResponse(err.message, err.field));
      return;
    }
    throw err;
  }
}

export async function deleteBlockedDateRange(req: AuthRequest, res: Response) {
  const query = blockedDateQuerySchema.parse(req.query);
  if (!query.from || !query.to) {
    res.status(400).json(errorResponse("Both 'from' and 'to' are required", "from"));
    return;
  }

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const result = await blockedDateService.deleteBlockedDateRange(
    villaId,
    query.from,
    query.to
  );
  res.json(successResponse(result));
}
