import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { loginSchema } from "../schemas/auth.schema";

export async function login(req: Request, res: Response) {
  const { username, password } = loginSchema.parse(req.body);

  const result = await authService.login(username, password);
  if (!result) {
    res.status(401).json(errorResponse("Invalid username or password"));
    return;
  }

  res.json(successResponse(result));
}
