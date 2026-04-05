import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("../../config/database");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../../config/env", () => ({
  env: {
    JWT_SECRET: "test-secret",
    JWT_EXPIRES_IN: "7d",
  },
}));

import prisma from "../../config/database";
import { login } from "../auth.service";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe("auth.service - login", () => {
  const fakeAdmin = {
    id: 1,
    email: "admin@villaelara.com",
    password: "hashed-password",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("when admin is found and password is valid", () => {
    beforeEach(() => {
      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue(fakeAdmin);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true as never);
      (mockJwt.sign as jest.Mock).mockReturnValue("signed-token");
    });

    it("calls findUnique with the provided email", async () => {
      await login("admin@villaelara.com", "secret");
      expect(mockPrisma.admin.findUnique).toHaveBeenCalledWith({
        where: { email: "admin@villaelara.com" },
      });
    });

    it("returns a token object", async () => {
      const result = await login("admin@villaelara.com", "secret");
      expect(result).toEqual({ token: "signed-token" });
    });

    it("signs the JWT with adminId payload and secret", async () => {
      await login("admin@villaelara.com", "secret");
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { adminId: fakeAdmin.id },
        "test-secret",
        expect.objectContaining({ expiresIn: "7d" })
      );
    });

    it("compares the provided password against stored hash", async () => {
      await login("admin@villaelara.com", "secret");
      expect(mockBcrypt.compare).toHaveBeenCalledWith("secret", fakeAdmin.password);
    });
  });

  describe("when admin is not found", () => {
    beforeEach(() => {
      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue(null);
    });

    it("returns null without checking password", async () => {
      const result = await login("unknown@example.com", "secret");
      expect(result).toBeNull();
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it("returns null for any email when no admin exists", async () => {
      const result = await login("admin@villaelara.com", "secret");
      expect(result).toBeNull();
    });
  });

  describe("when admin is found but password is invalid", () => {
    beforeEach(() => {
      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue(fakeAdmin);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false as never);
    });

    it("returns null", async () => {
      const result = await login("admin@villaelara.com", "wrong-password");
      expect(result).toBeNull();
    });

    it("does not sign a JWT token", async () => {
      await login("admin@villaelara.com", "wrong-password");
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });
  });

  describe("lookup is by email (not username)", () => {
    it("passes email to findUnique where clause", async () => {
      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue(null);
      await login("test@example.com", "pw");
      const callArg = (mockPrisma.admin.findUnique as jest.Mock).mock.calls[0][0];
      expect(callArg.where).toHaveProperty("email");
      expect(callArg.where).not.toHaveProperty("username");
    });
  });
});