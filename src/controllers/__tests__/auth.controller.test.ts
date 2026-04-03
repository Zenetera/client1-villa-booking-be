import { Request, Response } from "express";
import { login } from "../auth.controller";

jest.mock("../../services/auth.service");
jest.mock("../../config/env", () => ({
  env: {
    JWT_SECRET: "test-secret",
    JWT_EXPIRES_IN: "7d",
  },
}));

import * as authService from "../../services/auth.service";

const mockAuthService = authService as jest.Mocked<typeof authService>;

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("auth.controller - login", () => {
  describe("successful login", () => {
    it("returns 200 with token when credentials are valid", async () => {
      (mockAuthService.login as jest.Mock).mockResolvedValue({ token: "jwt-token" });
      const req = {
        body: { email: "admin@villaelara.com", password: "secret123" },
      } as Request;
      const res = makeRes();

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { token: "jwt-token" } })
      );
      expect(res.status).not.toHaveBeenCalled();
    });

    it("calls authService.login with email from request body", async () => {
      (mockAuthService.login as jest.Mock).mockResolvedValue({ token: "jwt-token" });
      const req = {
        body: { email: "admin@villaelara.com", password: "mypassword" },
      } as Request;
      const res = makeRes();

      await login(req, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        "admin@villaelara.com",
        "mypassword"
      );
    });
  });

  describe("invalid credentials", () => {
    it("returns 401 when authService.login returns null", async () => {
      (mockAuthService.login as jest.Mock).mockResolvedValue(null);
      const req = {
        body: { email: "admin@villaelara.com", password: "wrong" },
      } as Request;
      const res = makeRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({ message: "Invalid email or password" }),
          ]),
        })
      );
    });

    it("error message uses email wording (not username)", async () => {
      (mockAuthService.login as jest.Mock).mockResolvedValue(null);
      const req = {
        body: { email: "admin@villaelara.com", password: "wrong" },
      } as Request;
      const res = makeRes();

      await login(req, res);

      const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
      const errorMessage = jsonArg.errors[0].message as string;
      expect(errorMessage).toContain("email");
      expect(errorMessage).not.toContain("username");
    });
  });

  describe("validation errors", () => {
    it("throws ZodError when email is not a valid email address", async () => {
      const req = {
        body: { email: "not-an-email", password: "secret" },
      } as Request;
      const res = makeRes();

      await expect(login(req, res)).rejects.toThrow();
    });

    it("throws ZodError when email field is missing", async () => {
      const req = {
        body: { password: "secret" },
      } as Request;
      const res = makeRes();

      await expect(login(req, res)).rejects.toThrow();
    });

    it("throws ZodError when password is empty", async () => {
      const req = {
        body: { email: "admin@example.com", password: "" },
      } as Request;
      const res = makeRes();

      await expect(login(req, res)).rejects.toThrow();
    });

    it("throws ZodError when body contains username instead of email", async () => {
      const req = {
        body: { username: "admin", password: "secret" },
      } as Request;
      const res = makeRes();

      await expect(login(req, res)).rejects.toThrow();
    });
  });
});