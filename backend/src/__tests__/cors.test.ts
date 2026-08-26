import request from "supertest";
import { app } from "../app";

describe("CORS & Preflight OPTIONS Middleware Unit Tests", () => {
  const GITHUB_PAGES_ORIGIN = "https://ayushman-glb.github.io";

  test("Should handle OPTIONS /api/v1/auth/login preflight with 204 status and valid CORS headers", async () => {
    const res = await request(app)
      .options("/api/v1/auth/login")
      .set("Origin", GITHUB_PAGES_ORIGIN)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type, Authorization");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(GITHUB_PAGES_ORIGIN);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
  });

  test("Should handle OPTIONS /api/v1/auth/me preflight with 204 status", async () => {
    const res = await request(app)
      .options("/api/v1/auth/me")
      .set("Origin", GITHUB_PAGES_ORIGIN)
      .set("Access-Control-Request-Method", "GET");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(GITHUB_PAGES_ORIGIN);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  test("Should NOT throw 500 Internal Server Error on unallowed origin OPTIONS request", async () => {
    const res = await request(app)
      .options("/api/v1/auth/login")
      .set("Origin", "https://unauthorized-domain.com")
      .set("Access-Control-Request-Method", "POST");

    // Should return 204 or non-500 status without Access-Control-Allow-Origin header
    expect(res.status).not.toBe(500);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("getAllowedOrigins should include exact normalized GitHub Pages origin https://ayushman-glb.github.io", () => {
    const { getAllowedOrigins, isOriginAllowed } = require("../config/corsOrigins");
    const allowed = getAllowedOrigins();
    expect(allowed).toContain("https://ayushman-glb.github.io");
    expect(allowed).toContain("https://pg-management-system-boxb.onrender.com");
    expect(isOriginAllowed("https://ayushman-glb.github.io")).toBe(true);
    expect(isOriginAllowed("https://ayushman-glb.github.io/")).toBe(true);
    expect(isOriginAllowed("https://ayushman-glb.github.io/PG-Management-System")).toBe(true);
    expect(isOriginAllowed("https://evil-unauthorized-site.com")).toBe(false);
  });

  test("Should accept project-specific Vercel preview/production URLs and REJECT unrelated Vercel apps", () => {
    const { isOriginAllowed } = require("../config/corsOrigins");
    // Valid project preview deployment URLs
    expect(isOriginAllowed("https://pg-management-system-4i7wpxbe4-ayushman-8850s-projects.vercel.app")).toBe(true);
    expect(isOriginAllowed("https://pg-management-system-9c04620f-ayushman-8850s-projects.vercel.app")).toBe(true);
    expect(isOriginAllowed("https://pg-management-system.vercel.app")).toBe(true);

    // Unrelated / third-party Vercel apps must be rejected (no credentialed wildcard)
    expect(isOriginAllowed("https://some-other-app.vercel.app")).toBe(false);
    expect(isOriginAllowed("https://malicious-attacker-site.vercel.app")).toBe(false);
    expect(isOriginAllowed("https://unrelated-pg-app.vercel.app")).toBe(false);
  });
});

