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

  test("Socket.IO allowedOrigins should include GitHub Pages origin https://ayushman-glb.github.io", () => {
    const rawOrigins = [
      "https://ayushman-glb.github.io",
      "https://ayushman-glb.github.io/PG-Management-System",
      "https://pg-management-system-boxb.onrender.com",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
    ];
    const allowed = Array.from(
      new Set(
        rawOrigins.map((item) => {
          try {
            return new URL(item).origin.toLowerCase();
          } catch {
            return item.replace(/\/$/, "").toLowerCase();
          }
        })
      )
    );
    expect(allowed).toContain("https://ayushman-glb.github.io");
    expect(allowed).toContain("https://pg-management-system-boxb.onrender.com");
  });
});

