import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

dotenv.config();

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "TigyeokTaegyeok API",
    version: "0.1.0",
    description: "Backend API skeleton for the capstone project",
  },
  servers: [
    {
      url: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`,
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "Server health response",
          },
        },
      },
    },
    "/auth/google/login": {
      get: {
        summary: "Google OAuth login entrypoint",
        responses: {
          "501": {
            description: "Not implemented yet",
          },
        },
      },
    },
  },
};

export default function swaggerSetup(app) {
  app.get("/swagger.json", (_req, res) => {
    res.status(200).json(swaggerSpec);
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
