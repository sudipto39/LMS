import request from "supertest";
import { app } from "../app.js";

describe("Health Check API Endpoints", () => {
  it("GET / should return 200 and API info", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body).toHaveProperty("message");
  });

  it("GET /health should return 200 and ok status (public minimal response)", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "ok");
    // Public callers do not receive uptime/services details (security hardening)
    expect(res.body).not.toHaveProperty("services");
  });

  it("GET /health with internal key should return full details", async () => {
    const key = process.env["HEALTH_CHECK_KEY"];
    if (!key) return; // skip if no key configured in test env
    const res = await request(app).get("/health").set("x-health-key", key);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("services");
  });
});
