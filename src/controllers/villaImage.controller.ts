import { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import * as villaImageService from "../services/villaImage.service";
import {
  createImageSchema,
  updateImageSchema,
  reorderImagesSchema,
} from "../validators/villaImage.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";
import prisma from "../config/database";

async function getVillaId(): Promise<number | null> {
  const villa = await prisma.villa.findFirst({ select: { id: true } });
  return villa?.id ?? null;
}

export async function listImages(req: AuthRequest, res: Response) {
  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const images = await villaImageService.listImages(villaId);
  res.json(successResponse(images));
}

export async function createImage(req: AuthRequest, res: Response) {
  const input = createImageSchema.parse(req.body);

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const image = await villaImageService.createImage(villaId, input);
  res.status(201).json(successResponse(image));
}

export async function updateImage(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json(errorResponse("Invalid image ID", "id"));
    return;
  }

  const input = updateImageSchema.parse(req.body);

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const image = await villaImageService.updateImage(id, villaId, input);
  if (!image) {
    res.status(404).json(errorResponse("Image not found"));
    return;
  }

  res.json(successResponse(image));
}

export async function reorderImages(req: AuthRequest, res: Response) {
  const input = reorderImagesSchema.parse(req.body);

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const images = await villaImageService.reorderImages(villaId, input);
  res.json(successResponse(images));
}

export async function deleteImage(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json(errorResponse("Invalid image ID", "id"));
    return;
  }

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const deleted = await villaImageService.deleteImage(id, villaId);
  if (!deleted) {
    res.status(404).json(errorResponse("Image not found"));
    return;
  }

  res.json(successResponse(deleted));
}
