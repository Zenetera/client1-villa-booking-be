import { Request, Response } from "express";
import * as contactService from "../services/contact.service";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { updateContactSchema } from "../validators/contact.validator";

export async function getContactInfo(_req: Request, res: Response) {
  const contact = await contactService.getContactInfo();
  if (!contact) {
    res.status(404).json(errorResponse("Contact info not found"));
    return;
  }
  res.json(successResponse(contact));
}

export async function updateContactInfo(req: Request, res: Response) {
  const data = updateContactSchema.parse(req.body);

  const contact = await contactService.updateContactInfo(data);
  if (!contact) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }
  res.json(successResponse(contact));
}
