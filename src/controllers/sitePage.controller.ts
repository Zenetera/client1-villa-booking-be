import { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import * as sitePageService from "../services/sitePage.service";
import { SitePageError } from "../services/sitePage.service";
import {
  createSitePageSchema,
  updateSitePageSchema,
} from "../validators/sitePage.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";
import prisma from "../config/database";

async function getVillaId(): Promise<number | null> {
  const villa = await prisma.villa.findFirst({ select: { id: true } });
  return villa?.id ?? null;
}

// Public

export async function getPageBySlug(req: Request, res: Response) {
  const slug = req.params.slug as string;

  const page = await sitePageService.getPageBySlug(slug);
  if (!page) {
    res.status(404).json(errorResponse("Page not found"));
    return;
  }

  res.json(successResponse(page));
}

// Admin

export async function listPages(req: AuthRequest, res: Response) {
  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const pages = await sitePageService.listPages(villaId);
  res.json(successResponse(pages));
}

export async function getPage(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json(errorResponse("Invalid page ID", "id"));
    return;
  }

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const page = await sitePageService.getPageById(id, villaId);
  if (!page) {
    res.status(404).json(errorResponse("Page not found"));
    return;
  }

  res.json(successResponse(page));
}

export async function createPage(req: AuthRequest, res: Response) {
  const input = createSitePageSchema.parse(req.body);

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  try {
    const page = await sitePageService.createPage(villaId, input);
    res.status(201).json(successResponse(page));
  } catch (err) {
    if (err instanceof SitePageError) {
      res.status(400).json(errorResponse(err.message, err.field));
      return;
    }
    throw err;
  }
}

export async function updatePage(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json(errorResponse("Invalid page ID", "id"));
    return;
  }

  const input = updateSitePageSchema.parse(req.body);

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  try {
    const page = await sitePageService.updatePage(id, villaId, input);
    if (!page) {
      res.status(404).json(errorResponse("Page not found"));
      return;
    }
    res.json(successResponse(page));
  } catch (err) {
    if (err instanceof SitePageError) {
      res.status(400).json(errorResponse(err.message, err.field));
      return;
    }
    throw err;
  }
}

export async function deletePage(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json(errorResponse("Invalid page ID", "id"));
    return;
  }

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const deleted = await sitePageService.deletePage(id, villaId);
  if (!deleted) {
    res.status(404).json(errorResponse("Page not found"));
    return;
  }

  res.json(successResponse(deleted));
}
