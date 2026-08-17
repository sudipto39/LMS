import request from "supertest";
import { app } from "../app.js";
import { env } from "../config/env.js";

describe("Security Headers & CORS Policy Tests", () => {
  describe("HTTP Security Headers (Helmet)", () => {
    it("should set X-Content-Type-Options to nosniff", async () => {
      const res = await request(app).get("/health");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("should set Cross-Origin security policies", async () => {
      const res = await request(app).get("/health");
      expect(res.headers["cross-origin-opener-policy"]).toBeDefined();
    });

    it("should not expose X-Powered-By header", async () => {
      const res = await request(app).get("/health");
      expect(res.headers["x-powered-by"]).toBeUndefined();
    });

    it("should set Cache-Control to no-store on API responses", async () => {
      const res = await request(app).get("/health");
      expect(res.headers["cache-control"]).toBe("no-store");
    });
  });

  describe("CORS Policy Verification", () => {
    it("should allow requests from the configured CLIENT_URL origin", async () => {
      const allowedOrigin = env.CLIENT_URL.split(",")[0]?.trim() || "http://localhost:5173";

      const res = await request(app)
        .get("/health")
        .set("Origin", allowedOrigin);

      expect(res.statusCode).toBe(200);
      expect(res.headers["access-control-allow-origin"]).toBe(allowedOrigin);
      expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("should not set Access-Control-Allow-Origin for unauthorized origins", async () => {
      const unauthorizedOrigin = "https://malicious-phishing-site.com";

      const res = await request(app)
        .get("/health")
        .set("Origin", unauthorizedOrigin);

      expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });
});
