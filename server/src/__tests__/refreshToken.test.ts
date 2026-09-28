import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { signAccessToken, signRefreshToken } from "../utils/createSendToken.js";
import { prisma } from "../config/db.js";

describe("Refresh Token Lifecycle & Session Rotation Tests", () => {
  const userId = "user-test-123";
  const validRefreshToken = signRefreshToken(userId);
  const userAccessToken = signAccessToken(userId, "STUDENT");

  beforeEach(() => {
    jest.spyOn(prisma.user, "update").mockResolvedValue({
      id: userId,
      refreshToken: null,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/v1/auth/refresh-token", () => {
    it("should return 401 when no refreshToken cookie is present", async () => {
      const res = await request(app).post("/api/v1/auth/refresh-token");
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("No refresh token provided");
    });

    it("should return 401 when an invalid/tampered refresh token cookie is provided", async () => {
      const res = await request(app)
        .post("/api/v1/auth/refresh-token")
        .set("Cookie", ["refreshToken=invalid-tampered-token-12345"]);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Invalid or expired refresh token");
    });

    it("should return 401 when refresh token is revoked / does not match stored token in DB", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: userId,
        role: "STUDENT",
        isEmailVerified: true,
        refreshToken: "different-token-stored-in-db",
      } as any);

      const res = await request(app)
        .post("/api/v1/auth/refresh-token")
        .set("Cookie", [`refreshToken=${validRefreshToken}`]);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Refresh token revoked or invalid");
    });

    it("should return 200 and a new accessToken when a valid refresh token is supplied", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: userId,
        role: "STUDENT",
        isEmailVerified: true,
        refreshToken: validRefreshToken,
      } as any);

      const res = await request(app)
        .post("/api/v1/auth/refresh-token")
        .set("Cookie", [`refreshToken=${validRefreshToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.accessToken).toBeDefined();
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should clear the refreshToken cookie and return 200 on logout", async () => {
      // Use a separate userId to avoid in-memory revocation state pollution from prior tests
      const logoutUserId = "logout-test-user-456";
      const freshAccessToken = signAccessToken(logoutUserId, "STUDENT");

      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: logoutUserId,
        role: "STUDENT",
        isEmailVerified: true,
      } as any);

      const res = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${freshAccessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.message).toBe("Logged out successfully");

      const cookies = res.headers["set-cookie"] as string[] | undefined;
      expect(cookies).toBeDefined();
      expect(cookies?.[0]).toContain("refreshToken=");
    });
  });
});
