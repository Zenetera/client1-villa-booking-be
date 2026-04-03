import { Prisma } from "@prisma/client";
import prisma from "../config/database";
import type {
  CreatePricingRuleInput,
  UpdatePricingRuleInput,
} from "../validators/pricingRule.validator";

export async function listPricingRules(villaId: number) {
  return prisma.pricingRule.findMany({
    where: { villaId },
    orderBy: [{ startDate: "asc" }, { priority: "desc" }],
  });
}

export async function getPricingRule(id: number, villaId: number) {
  const rule = await prisma.pricingRule.findUnique({ where: { id } });
  if (!rule || rule.villaId !== villaId) return null;
  return rule;
}

export async function createPricingRule(
  villaId: number,
  input: CreatePricingRuleInput
) {
  return prisma.pricingRule.create({
    data: {
      villaId,
      name: input.name,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      pricePerNight: new Prisma.Decimal(input.pricePerNight),
      minNights: input.minNights ?? null,
      priority: input.priority,
    },
  });
}

export async function updatePricingRule(
  id: number,
  villaId: number,
  input: UpdatePricingRuleInput
) {
  const existing = await prisma.pricingRule.findUnique({ where: { id } });
  if (!existing || existing.villaId !== villaId) return null;

  return prisma.pricingRule.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.startDate !== undefined && {
        startDate: new Date(input.startDate),
      }),
      ...(input.endDate !== undefined && { endDate: new Date(input.endDate) }),
      ...(input.pricePerNight !== undefined && {
        pricePerNight: new Prisma.Decimal(input.pricePerNight),
      }),
      ...(input.minNights !== undefined && { minNights: input.minNights }),
      ...(input.priority !== undefined && { priority: input.priority }),
    },
  });
}

export async function deletePricingRule(id: number, villaId: number) {
  const existing = await prisma.pricingRule.findUnique({ where: { id } });
  if (!existing || existing.villaId !== villaId) return null;

  return prisma.pricingRule.delete({ where: { id } });
}
