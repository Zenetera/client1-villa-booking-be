import { loginSchema } from "../auth.schema";

describe("loginSchema", () => {
  describe("valid inputs", () => {
    it("parses a valid email and password", () => {
      const result = loginSchema.parse({
        email: "admin@villaelara.com",
        password: "secret",
      });
      expect(result).toEqual({ email: "admin@villaelara.com", password: "secret" });
    });

    it("accepts a password with exactly 1 character", () => {
      const result = loginSchema.parse({ email: "a@b.com", password: "x" });
      expect(result.password).toBe("x");
    });

    it("accepts complex email formats", () => {
      const result = loginSchema.parse({
        email: "user+tag@sub.domain.com",
        password: "p@ssw0rd",
      });
      expect(result.email).toBe("user+tag@sub.domain.com");
    });
  });

  describe("invalid email", () => {
    it("rejects missing email field", () => {
      expect(() =>
        loginSchema.parse({ password: "secret" })
      ).toThrow();
    });

    it("rejects a plain username string as email", () => {
      expect(() =>
        loginSchema.parse({ email: "admin", password: "secret" })
      ).toThrow();
    });

    it("rejects email missing @ symbol", () => {
      expect(() =>
        loginSchema.parse({ email: "adminvillaelara.com", password: "secret" })
      ).toThrow();
    });

    it("rejects email missing domain part", () => {
      expect(() =>
        loginSchema.parse({ email: "admin@", password: "secret" })
      ).toThrow();
    });

    it("rejects empty string email", () => {
      expect(() =>
        loginSchema.parse({ email: "", password: "secret" })
      ).toThrow();
    });

    it("rejects non-string email type", () => {
      expect(() =>
        loginSchema.parse({ email: 123, password: "secret" })
      ).toThrow();
    });
  });

  describe("invalid password", () => {
    it("rejects missing password field", () => {
      expect(() =>
        loginSchema.parse({ email: "admin@villaelara.com" })
      ).toThrow();
    });

    it("rejects empty string password", () => {
      expect(() =>
        loginSchema.parse({ email: "admin@villaelara.com", password: "" })
      ).toThrow();
    });

    it("rejects non-string password type", () => {
      expect(() =>
        loginSchema.parse({ email: "admin@villaelara.com", password: 123 })
      ).toThrow();
    });
  });

  describe("safeParse", () => {
    it("returns success:false with email field error for invalid email", () => {
      const result = loginSchema.safeParse({ email: "notanemail", password: "pw" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.errors.find((e) => e.path.includes("email"));
        expect(emailError).toBeDefined();
      }
    });

    it("returns success:true for valid credentials", () => {
      const result = loginSchema.safeParse({
        email: "admin@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });
  });
});