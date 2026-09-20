import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";

describe("Rate Limiting (Brute-Force Protection) Tests", () => {
  it("should trigger HTTP 429 Too Many Requests when auth rate limit is exceeded", async () => {
    // Send 10 requests to consume the allowed quota
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "bad@test.com", password: "wrongpassword" });

      expect(res.statusCode).not.toBe(429);
    }

    // 11th request must be blocked by express-rate-limit
    const blockedRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bad@test.com", password: "wrongpassword" });

    expect(blockedRes.statusCode).toBe(429);
    expect(blockedRes.text).toContain("Too many requests from this IP");
  }, 15000);
});
