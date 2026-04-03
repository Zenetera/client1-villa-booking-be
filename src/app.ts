import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";
import openApiDocument from "./docs/openapi";

const app = express();

// Middleware
const allowedOrigins = [env.FRONTEND_URL];
if (env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:5173", "http://localhost:3000");
}
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API docs
app.get("/docs.json", (_req, res) => {
  res.json(openApiDocument);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Routes
app.use("/api", routes);

// Error handler
app.use(errorHandler);

export default app;
