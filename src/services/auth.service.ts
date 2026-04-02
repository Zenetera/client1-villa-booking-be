import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import prisma from "../config/database";
import { env } from "../config/env";

export async function login(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return null;

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return null;

  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any };
  const token = jwt.sign({ adminId: admin.id }, env.JWT_SECRET, options);

  return { token };
}
