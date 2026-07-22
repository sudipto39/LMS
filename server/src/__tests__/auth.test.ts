import request from "supertest";
import { app } from "../app.js";

describe("Auth API Endpoints Integration Tests", () => {
  describe("POST /api/v1/auth/login", () => {
    it("should return 400 when email or password is missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("status", "fail");
    });

    it("should return 400 when email format is invalid", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "invalid-email-format",
          password: "password123",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("status", "fail");
    });
  });

  describe("POST /api/v1/auth/register", () => {
    it("should return 400 when weak password is provided", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Test User",
          universityId: "UNI123",
          email: "test@university.edu",
          password: "weak", // Missing uppercase, number, special char
          phoneNumber: "1234567890",
          department: "Computer Science",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("status", "fail");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should return 401 when calling protected logout without JWT token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/logout")
        .send({});

      expect(res.statusCode).toBe(401);
    });
  });
});
