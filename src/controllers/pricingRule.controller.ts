import { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import * as pricingRuleService from "../services/pricingRule.service";
import {
  createPricingRuleSchema,
  updatePricingRuleSchema,
} from "../validators/pricingRule.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";
import prisma from "../config/database";

async function getVillaId(): Promise<number | null> {
  const villa = await prisma.villa.findFirst({ select: { id: true } });
  return villa?.id ?? null;
}

export async function listPricingRules(req: AuthRequest, res: Response) {
  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const rules = await pricingRuleService.listPricingRules(villaId);
  res.json(successResponse(rules));
}

export async function createPricingRule(req: AuthRequest, res: Response) {
  const input = createPricingRuleSchema.parse(req.body);

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const rule = await pricingRuleService.createPricingRule(villaId, input);
  res.status(201).json(successResponse(rule));
}

export async function updatePricingRule(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(errorResponse("Invalid pricing rule ID", "id"));
    return;
  }

  const input = updatePricingRuleSchema.parse(req.body);

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const rule = await pricingRuleService.updatePricingRule(id, villaId, input);
  if (!rule) {
    res.status(404).json(errorResponse("Pricing rule not found"));
    return;
  }

  res.json(successResponse(rule));
}

export async function deletePricingRule(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(errorResponse("Invalid pricing rule ID", "id"));
    return;
  }

  const villaId = await getVillaId();
  if (!villaId) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const deleted = await pricingRuleService.deletePricingRule(id, villaId);
  if (!deleted) {
    res.status(404).json(errorResponse("Pricing rule not found"));
    return;
  }

  res.json(successResponse(deleted));
}
