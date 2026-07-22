import request from "supertest";
import { app } from "../app.js";

describe("Health Check API Endpoints", () => {
  it("GET / should return 200 and API info", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body).toHaveProperty("message");
  });

  it("GET /health should return 200 and ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("uptime");
  });
});
