import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env";
import { PathResolver } from "../utils/pathResolver";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RoomBae Enterprise PG Management & Co-living API",
      version: "1.0.0",
      description: `
## RoomBae Zero-Trust API Documentation & Testing Console

RoomBae provides an end-to-end PG and Co-living management platform with 3 canonical roles:
- **ADMIN**: Verification reviewer, property approval, platform operations, and system administration
- **PG_OWNER**: PG property owner managing buildings, rooms, beds, billing, complaints & KYC
- **RESIDENT**: Tenant portal for rent payments, gate passes, visitor passes, room transfers, and maintenance

### Authentication Instructions:
1. Call **POST** \`/auth/login\` with your user credentials.
2. Copy the \`accessToken\` from the response body (or cookies).
3. Click the green **Authorize 🔓** button at the top right of this page.
4. Enter \`Bearer <your_token>\` and click **Authorize**.
5. You can now execute protected endpoints under your authorized role!
      `,
      contact: {
        name: "RoomBae Platform Architecture",
        email: "engineering@roombae.com",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "Relative Server URL (Auto-matches host and port)",
      },
      {
        url: `${env.API_BASE_URL.replace(/\/$/, "")}${env.API_PREFIX}`,
        description: "Active Configured Server",
      },
      {
        url: "http://localhost:5000/api/v1",
        description: "Local Development Server",
      },
      {
        url: "https://roombae-backend.onrender.com/api/v1",
        description: "Production Cloud Server (Render)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT Bearer token obtained from POST /auth/login (e.g. 'Bearer eyJhbGciOi...')",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Request executed successfully" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message details" },
            code: { type: "string", example: "FORBIDDEN" },
            errors: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    paths: {
      // ── Health & Diagnostics ────────────────────────────────────────────────
      "/health": {
        get: {
          summary: "System Health Probe",
          tags: ["System Health"],
          responses: {
            "200": { description: "API system is healthy" },
          },
        },
      },
      "/health/pipeline-test": {
        get: {
          summary: "Middleware Pipeline Self-Diagnostic",
          tags: ["System Health"],
          responses: {
            "200": { description: "Middleware pipeline operational" },
          },
        },
      },

      // ── Authentication ──────────────────────────────────────────────────────
      "/auth/login": {
        post: {
          summary: "Authenticate User (Unified Login for all Roles)",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["password"],
                  properties: {
                    identifier: { type: "string", example: "ayushman@globussoft.in", description: "Email, Phone (+91...) or Resident Code" },
                    email: { type: "string", example: "ayushman@globussoft.in" },
                    password: { type: "string", example: "987456" },
                    rememberMe: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Authenticated successfully. Tokens set in HttpOnly cookies + response body." },
            "401": { description: "Invalid credentials" },
          },
        },
      },
      "/auth/register": {
        post: {
          summary: "Register New Account (Owner or Resident)",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string", example: "Rajesh Sharma" },
                    email: { type: "string", example: "rajesh.owner@roombae.com" },
                    phone: { type: "string", example: "+919876543210" },
                    password: { type: "string", example: "OwnerPass123!" },
                    role: { type: "string", enum: ["OWNER", "RESIDENT"], example: "OWNER" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Account created successfully" },
            "400": { description: "Validation error or email already registered" },
          },
        },
      },
      "/auth/me": {
        get: {
          summary: "Get Current Authenticated User Session",
          security: [{ bearerAuth: [] }],
          tags: ["Authentication"],
          responses: {
            "200": { description: "Authenticated user object with role and permissions" },
            "401": { description: "Authentication required" },
          },
        },
      },
      "/auth/refresh-token": {
        post: {
          summary: "Rotate Refresh Token & Issue Fresh Access Token",
          tags: ["Authentication"],
          responses: {
            "200": { description: "Fresh access token issued" },
            "401": { description: "Invalid or revoked refresh token" },
          },
        },
      },
      "/auth/logout": {
        post: {
          summary: "Sign Out & Revoke Session Tokens",
          security: [{ bearerAuth: [] }],
          tags: ["Authentication"],
          responses: {
            "200": { description: "Logged out successfully" },
          },
        },
      },
      "/auth/verify-2fa": {
        post: {
          summary: "Verify TOTP 2FA Challenge",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token"],
                  properties: {
                    tokenOrUserId: { type: "string", example: "pre_auth_token_xyz" },
                    token: { type: "string", example: "123456" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "2FA verified, session authenticated" },
          },
        },
      },

      // ── GOD Platform Operations (GOD Role Only) ─────────────────────────────
      "/god/overview": {
        get: {
          summary: "Platform Executive KPIs & Multi-Tenant Analytics (GOD Role Only)",
          security: [{ bearerAuth: [] }],
          tags: ["GOD Platform Master"],
          responses: {
            "200": { description: "Total owners, residents, beds, MRR, ARR, and growth curves" },
            "403": { description: "Forbidden: GOD role required" },
          },
        },
      },
      "/god/owners": {
        get: {
          summary: "List All PG Owners with Subscriptions & Capacities (GOD Role Only)",
          security: [{ bearerAuth: [] }],
          tags: ["GOD Platform Master"],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "city", in: "query", schema: { type: "string" } },
            { name: "kycStatus", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Paginated PG owner directory" },
            "403": { description: "Forbidden: GOD role required" },
          },
        },
      },
      "/god/owners/{id}": {
        get: {
          summary: "Detailed Owner Drilldown with Masked PII, Properties & Residents (GOD Role Only)",
          security: [{ bearerAuth: [] }],
          tags: ["GOD Platform Master"],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Full owner profile, business entity, properties and tenant roster" },
            "404": { description: "Owner not found" },
          },
        },
      },
      "/god/residents": {
        get: {
          summary: "Platform-Wide Resident Directory Across All Facilities (GOD Role Only)",
          security: [{ bearerAuth: [] }],
          tags: ["GOD Platform Master"],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "pgId", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Platform-wide resident directory" },
            "403": { description: "Forbidden: GOD role required" },
          },
        },
      },
      "/god/revenue": {
        get: {
          summary: "SaaS Platform Recurring Revenue Analytics (GOD Role Only)",
          security: [{ bearerAuth: [] }],
          tags: ["GOD Platform Master"],
          parameters: [
            { name: "timeframe", in: "query", schema: { type: "string", enum: ["monthly", "quarterly", "yearly"], default: "monthly" } },
          ],
          responses: {
            "200": { description: "Subscription revenue by tier, MRR, ARR, and history" },
            "403": { description: "Forbidden: GOD role required" },
          },
        },
      },

      // ── Resident Portal Endpoints ───────────────────────────────────────────
      "/residents/portal/me": {
        get: {
          summary: "Resident Self-Service Dashboard Data",
          security: [{ bearerAuth: [] }],
          tags: ["Resident Portal"],
          responses: {
            "200": { description: "Resident profile, room, bed, WiFi credentials, roommates, invoices, agreements" },
            "404": { description: "Resident profile incomplete / not assigned" },
          },
        },
      },
      "/residents/visitor-pass": {
        post: {
          summary: "Generate Digital Visitor Pass with QR Code",
          security: [{ bearerAuth: [] }],
          tags: ["Resident Portal"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["visitorName", "visitorMobile", "visitDate"],
                  properties: {
                    visitorName: { type: "string", example: "Kiran Rao" },
                    visitorMobile: { type: "string", example: "+919876543210" },
                    relation: { type: "string", example: "Friend" },
                    visitDate: { type: "string", example: "2026-08-25" },
                    timeSlot: { type: "string", example: "16:00 - 18:00" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Visitor pass generated with QR code" },
          },
        },
      },
      "/residents/gate-pass": {
        post: {
          summary: "Submit Outing / Leave Gate Pass",
          security: [{ bearerAuth: [] }],
          tags: ["Resident Portal"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["passType", "destination", "departureTime", "returnTime"],
                  properties: {
                    passType: { type: "string", enum: ["DAY_OUTING", "NIGHT_OUT", "HOME_LEAVE"], example: "DAY_OUTING" },
                    destination: { type: "string", example: "MG Road, Bengaluru" },
                    departureTime: { type: "string", example: "2026-08-22T10:00:00.000Z" },
                    returnTime: { type: "string", example: "2026-08-22T20:00:00.000Z" },
                    reason: { type: "string", example: "Personal errand" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Gate pass submitted successfully" },
          },
        },
      },
      "/residents/meal-skip": {
        post: {
          summary: "Toggle Meal Skip (Prevents Food Wastage)",
          security: [{ bearerAuth: [] }],
          tags: ["Resident Portal"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["date", "mealType"],
                  properties: {
                    date: { type: "string", example: "2026-08-22" },
                    mealType: { type: "string", enum: ["BREAKFAST", "LUNCH", "DINNER"], example: "DINNER" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Meal preference recorded" },
          },
        },
      },

      "/auth/csrf-token": {
        get: {
          summary: "Get CSRF Double-Submit Token",
          tags: ["Authentication"],
          responses: {
            "200": { description: "CSRF token returned and cookie set" },
          },
        },
      },

      // ── PG Properties & Marketplace ─────────────────────────────────────────
      "/properties": {
        get: {
          summary: "Search & Browse Public PG Listings",
          tags: ["Properties & Inventory"],
          parameters: [
            { name: "city", in: "query", schema: { type: "string" } },
            { name: "minPrice", in: "query", schema: { type: "number" } },
            { name: "maxPrice", in: "query", schema: { type: "number" } },
            { name: "roomType", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Matching PG listings" },
          },
        },
        post: {
          summary: "Create New PG Property Listing (Owner Role Only)",
          security: [{ bearerAuth: [] }],
          tags: ["Properties & Inventory"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "address", "city"],
                  properties: {
                    name: { type: "string", example: "Swagger Live UI Test PG" },
                    address: { type: "string", example: "100 Outer Ring Road, Bellandur, Bangalore" },
                    city: { type: "string", example: "Bangalore" },
                    genderPolicy: { type: "string", example: "UNISEX" },
                    totalRooms: { type: "number", example: 4 },
                    totalBeds: { type: "number", example: 8 },
                    monthlyRent: { type: "number", example: 9500 },
                    securityDeposit: { type: "number", example: 19000 },
                    noticePeriodDays: { type: "number", example: 30 },
                    gateClosingTime: { type: "string", example: "22:30" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Property created successfully" },
            "403": { description: "Forbidden: Owner role required" },
          },
        },
      },
      "/properties/search": {
        get: {
          summary: "Marketplace Multi-Param Search",
          tags: ["Properties & Inventory"],
          parameters: [
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "city", in: "query", schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          ],
          responses: {
            "200": { description: "Search results returned" },
          },
        },
      },
      "/properties/public": {
        get: {
          summary: "Public Property Catalog",
          tags: ["Properties & Inventory"],
          responses: {
            "200": { description: "Public properties returned" },
          },
        },
      },
      "/properties/owner-summary": {
        get: {
          summary: "Owner Portfolio Summary (Owner Dashboard)",
          security: [{ bearerAuth: [] }],
          tags: ["Properties & Inventory"],
          responses: {
            "200": { description: "Owner's properties, beds, residents, and revenue metrics" },
          },
        },
      },

      // ── Billing & Payments ──────────────────────────────────────────────────
      "/billing/create-order": {
        post: {
          summary: "Create Razorpay Payment Order for Rent or Fine",
          security: [{ bearerAuth: [] }],
          tags: ["Billing & Payments"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount", "purpose"],
                  properties: {
                    amount: { type: "number", example: 8500 },
                    purpose: { type: "string", example: "Monthly PG Rent - August" },
                    pgId: { type: "string", example: "64a000000000000000000001" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Razorpay order created with order_id" },
          },
        },
      },
      "/billing/verify-payment": {
        post: {
          summary: "Verify Razorpay Payment Signature & Issue GST Invoice",
          security: [{ bearerAuth: [] }],
          tags: ["Billing & Payments"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"],
                  properties: {
                    razorpay_order_id: { type: "string", example: "order_xyz123" },
                    razorpay_payment_id: { type: "string", example: "pay_abc456" },
                    razorpay_signature: { type: "string", example: "signature_hex" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Payment verified, invoice generated" },
          },
        },
      },

      // ── Complaints & Support ────────────────────────────────────────────────
      "/complaints": {
        get: {
          summary: "List Complaints (Scoped by User Role)",
          security: [{ bearerAuth: [] }],
          tags: ["Complaints & Maintenance"],
          responses: {
            "200": { description: "List of complaints tickets" },
          },
        },
        post: {
          summary: "File Maintenance Complaint Ticket",
          security: [{ bearerAuth: [] }],
          tags: ["Complaints & Maintenance"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "description", "category"],
                  properties: {
                    title: { type: "string", example: "Geyser not heating in Room 204" },
                    description: { type: "string", example: "Water is lukewarm since yesterday morning." },
                    category: { type: "string", example: "Plumbing" },
                    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "EMERGENCY"], example: "MEDIUM" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Complaint ticket created" },
          },
        },
      },
    },
  },
  apis: [
    PathResolver.resolveFromRoot("src", "routes", "*.ts"),
    PathResolver.resolveFromRoot("src", "modules", "**", "*.ts"),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
