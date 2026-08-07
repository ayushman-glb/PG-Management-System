import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env";
import { PathResolver } from "../utils/pathResolver";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RoomBae Zero-Trust Enterprise PG Management API",
      version: "1.0.0",
      description:
        "Production-ready REST API specifications for RoomBae PG Management System.",
      contact: {
        name: "RoomBae Engineering",
        email: "engineering@roombae.com",
      },
    },
    servers: [
      {
        url: `${env.API_BASE_URL.replace(/\/$/, "")}${env.API_PREFIX}`,
        description: "Production API Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
            message: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                code: { type: "string" },
              },
            },
          },
        },
        HealthCheckResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            status: { type: "string", example: "UP" },
            timestamp: { type: "string" },
            uptimeSeconds: { type: "number" },
            environment: { type: "string" },
            memoryUsage: { type: "object" },
            database: {
              type: "object",
              properties: {
                status: { type: "string" },
                provider: { type: "string" },
                latencyMs: { type: "number" },
              },
            },
            services: {
              type: "object",
              properties: {
                rest: { type: "string" },
                soap: { type: "string" },
                redis: { type: "string" },
              },
            },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          summary: "Detailed System Health Metrics",
          description:
            "Returns real-time status of database, memory, services, and uptime.",
          tags: ["Health"],
          responses: {
            "200": {
              description: "System operational",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthCheckResponse" },
                },
              },
            },
          },
        },
      },
      "/ready": {
        get: {
          summary: "Service Readiness Probe",
          description:
            "Used by load balancers and orchestrators to check if backend is ready for traffic.",
          tags: ["Health"],
          responses: {
            "200": { description: "Backend is ready" },
            "503": {
              description: "Backend is starting or database unreachable",
            },
          },
        },
      },
      "/live": {
        get: {
          summary: "Liveness Probe",
          description:
            "Basic liveness check verifying the HTTP process is alive.",
          tags: ["Health"],
          responses: {
            "200": { description: "Process alive" },
          },
        },
      },
      "/auth/login": {
        post: {
          summary: "User Authentication / Login",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", example: "admin@roombae.com" },
                    password: { type: "string", example: "AdminPass123!" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Authenticated successfully" },
            "401": { description: "Invalid credentials" },
          },
        },
      },
      "/auth/register": {
        post: {
          summary: "User Registration (Unified Wizard)",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password", "name", "role"],
                  properties: {
                    name: { type: "string", example: "Rajesh Kumar" },
                    email: { type: "string", example: "rajesh@roombae.com" },
                    password: { type: "string", example: "Password123!" },
                    phone: { type: "string", example: "+91 98765 43210" },
                    role: {
                      type: "string",
                      enum: ["OWNER", "RESIDENT"],
                      example: "OWNER",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "User account created successfully" },
            "400": { description: "Validation or duplication error" },
          },
        },
      },
      "/auth/send-phone-otp": {
        post: {
          summary: "Request Phone OTP",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["phone"],
                  properties: {
                    phone: { type: "string", example: "+91 98765 43210" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "OTP sent with countdown timer duration" },
          },
        },
      },
      "/auth/verify-phone-otp": {
        post: {
          summary: "Verify Phone OTP Code",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["phone", "otp"],
                  properties: {
                    phone: { type: "string", example: "+91 98765 43210" },
                    otp: { type: "string", example: "123456" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Phone verified successfully" },
          },
        },
      },
      "/auth/enable-2fa": {
        post: {
          summary: "Generate 2FA QR Code & Secret (Settings -> Security)",
          security: [{ bearerAuth: [] }],
          tags: ["Authentication"],
          responses: {
            "200": { description: "TOTP Secret & QR Code URL generated" },
          },
        },
      },
      "/auth/verify-2fa": {
        post: {
          summary: "Verify TOTP Code to Activate 2FA",
          security: [{ bearerAuth: [] }],
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token"],
                  properties: {
                    token: { type: "string", example: "123456" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "2FA activated successfully" },
          },
        },
      },
      "/auth/refresh-token": {
        post: {
          summary: "Refresh Access Token",
          tags: ["Authentication"],
          responses: {
            "200": { description: "New JWT access token issued" },
          },
        },
      },
      "/auth/me": {
        get: {
          summary: "Get Current Authenticated User Profile",
          security: [{ bearerAuth: [] }],
          tags: ["Authentication"],
          responses: {
            "200": { description: "User account details" },
          },
        },
      },

      "/properties": {
        get: {
          summary: "List Public PG Listings",
          tags: ["Properties"],
          parameters: [
            { name: "city", in: "query", schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "List of properties" },
          },
        },
      },
      "/residents": {
        get: {
          summary: "List Resident Directory",
          security: [{ bearerAuth: [] }],
          tags: ["Residents"],
          responses: {
            "200": { description: "Resident list" },
          },
        },
      },
      "/agreements": {
        get: {
          summary: "List Rental Agreements",
          security: [{ bearerAuth: [] }],
          tags: ["Agreements"],
          responses: {
            "200": { description: "Agreements list" },
          },
        },
      },
      "/complaints": {
        get: {
          summary: "List Support Tickets & Complaints",
          security: [{ bearerAuth: [] }],
          tags: ["Complaints"],
          responses: {
            "200": { description: "Complaints list" },
          },
        },
      },
      "/billing/invoices": {
        get: {
          summary: "List Billing Invoices",
          security: [{ bearerAuth: [] }],
          tags: ["Billing"],
          responses: {
            "200": { description: "Invoices list" },
          },
        },
      },
    },
  },
  apis: [
    PathResolver.resolveFromRoot("src", "routes", "*.ts"),
    PathResolver.resolveFromRoot("src", "modules", "**", "*.ts"),
    PathResolver.resolveFromRoot("dist", "src", "routes", "*.js"),
    PathResolver.resolveFromRoot("dist", "src", "modules", "**", "*.js"),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
