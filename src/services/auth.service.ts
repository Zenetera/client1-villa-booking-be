import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export async function login(username: string, password: string) {
  if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
    return null;
  }

  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any };
  const token = jwt.sign({ admin: true }, env.JWT_SECRET, options);

  return { token };
}
