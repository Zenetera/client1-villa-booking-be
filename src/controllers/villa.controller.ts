import { Request, Response } from "express";
import * as villaService from "../services/villa.service";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { updateVillaSchema } from "../schemas/villa.schema";

export async function getVilla(_req: Request, res: Response) {
  const villa = await villaService.getVilla();
  if (!villa) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }
  res.json(successResponse(villa));
}

export async function updateVilla(req: Request, res: Response) {
  const data = updateVillaSchema.parse(req.body);

  const existing = await villaService.getVilla();
  if (!existing) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const villa = await villaService.updateVilla(existing.id, data);
  res.json(successResponse(villa));
}
