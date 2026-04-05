/**
 * Tests for src/app.ts and route changes:
 * - Swagger UI and /docs.json routes were removed in this PR
 * - /health route still present
 * - /api routes registered (without booking/availability/stats routes)
 */

process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "7d";
process.env.ADMIN_EMAIL = "admin@test.com";
process.env.ADMIN_PASSWORD = "testpassword";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";
process.env.EMAIL_HOST = "smtp.test.com";
process.env.EMAIL_HOST_USER = "user@test.com";
process.env.EMAIL_HOST_PASSWORD = "emailpass";
process.env.DEFAULT_FROM_EMAIL = "from@test.com";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.NODE_ENV = "test";

jest.mock("../config/database");
jest.mock("../services/villa.service", () => ({
  getVilla: jest.fn().mockResolvedValue(null),
  updateVilla: jest.fn(),
}));

import express from "express";

describe("app route registration", () => {
  /**
   * Extract all registered paths from an express app's router stack.
   */
  function getRegisteredPaths(app: express.Express): string[] {
    const paths: string[] = [];
    // Access the internal router
    const router = (app as any)._router;
    if (!router) return paths;

    router.stack.forEach((layer: any) => {
      if (layer.route) {
        paths.push(layer.route.path);
      } else if (layer.handle?.stack) {
        // Mounted router - get its base path
        const basePath = layer.regexp?.source || "";
        layer.handle.stack.forEach((subLayer: any) => {
          if (subLayer.route) {
            paths.push(subLayer.route.path);
          }
        });
      }
    });
    return paths;
  }

  function hasPath(app: express.Express, path: string): boolean {
    const router = (app as any)._router;
    if (!router) return false;

    function searchStack(stack: any[]): boolean {
      for (const layer of stack) {
        if (layer.route?.path === path) return true;
        if (layer.handle?.stack) {
          if (searchStack(layer.handle.stack)) return true;
        }
      }
      return false;
    }
    return searchStack(router.stack);
  }

  let app: express.Express;

  beforeAll(() => {
    jest.resetModules();
    // Re-import after env is set
    app = require("../app").default;
  });

  it("has /health route registered", () => {
    expect(hasPath(app, "/health")).toBe(true);
  });

  it("does not have /docs.json route (removed swagger)", () => {
    expect(hasPath(app, "/docs.json")).toBe(false);
  });

  it("does not have /docs route (removed swagger UI)", () => {
    expect(hasPath(app, "/docs")).toBe(false);
  });
});

describe("admin routes - only villa update (no booking routes)", () => {
  it("admin router has PUT /villa", () => {
    const adminRouter = require("../routes/admin.routes").default;
    const stack = adminRouter.stack;

    const villaUpdateLayer = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/villa" &&
        layer.route.methods.put
    );
    expect(villaUpdateLayer).toBeDefined();
  });

  it("admin router has no /bookings route", () => {
    const adminRouter = require("../routes/admin.routes").default;
    const stack = adminRouter.stack;

    const bookingLayer = stack.find(
      (layer: any) => layer.route?.path?.includes("bookings")
    );
    expect(bookingLayer).toBeUndefined();
  });

  it("admin router has no /stats route", () => {
    const adminRouter = require("../routes/admin.routes").default;
    const stack = adminRouter.stack;

    const statsLayer = stack.find(
      (layer: any) => layer.route?.path?.includes("stats")
    );
    expect(statsLayer).toBeUndefined();
  });
});

describe("public routes - only villa (no availability/booking routes)", () => {
  it("public router has GET /villa", () => {
    const publicRouter = require("../routes/public.routes").default;
    const stack = publicRouter.stack;

    const villaLayer = stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/villa" &&
        layer.route.methods.get
    );
    expect(villaLayer).toBeDefined();
  });

  it("public router has no /availability route", () => {
    const publicRouter = require("../routes/public.routes").default;
    const stack = publicRouter.stack;

    const availLayer = stack.find(
      (layer: any) => layer.route?.path?.includes("availability")
    );
    expect(availLayer).toBeUndefined();
  });

  it("public router has no /pricing route", () => {
    const publicRouter = require("../routes/public.routes").default;
    const stack = publicRouter.stack;

    const pricingLayer = stack.find(
      (layer: any) => layer.route?.path?.includes("pricing")
    );
    expect(pricingLayer).toBeUndefined();
  });

  it("public router has no /bookings route", () => {
    const publicRouter = require("../routes/public.routes").default;
    const stack = publicRouter.stack;

    const bookingLayer = stack.find(
      (layer: any) => layer.route?.path?.includes("bookings")
    );
    expect(bookingLayer).toBeUndefined();
  });
});