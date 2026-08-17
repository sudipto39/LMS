import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { signAccessToken } from "../utils/createSendToken.js";
import { prisma } from "../config/db.js";

describe("Role-Based Access Control (RBAC) Integration Tests", () => {
  const studentToken = signAccessToken("student-1", "STUDENT");
  const supervisorToken = signAccessToken("supervisor-1", "SUPERVISOR");
  const adminToken = signAccessToken("admin-1", "ADMIN");

  beforeEach(() => {
    jest.spyOn(prisma.user, "findUnique").mockImplementation((args: any) => {
      const id = args.where?.id;
      if (id === "student-1") {
        return Promise.resolve({
          id: "student-1",
          name: "Student",
          email: "student@test.com",
          role: "STUDENT",
          isEmailVerified: true,
          giteaUsername: "student1",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
      if (id === "supervisor-1") {
        return Promise.resolve({
          id: "supervisor-1",
          name: "Supervisor",
          email: "supervisor@test.com",
          role: "SUPERVISOR",
          isEmailVerified: true,
          giteaUsername: "supervisor1",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
      if (id === "admin-1") {
        return Promise.resolve({
          id: "admin-1",
          name: "Admin",
          email: "admin@test.com",
          role: "ADMIN",
          isEmailVerified: true,
          giteaUsername: "admin1",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Admin Route Protection (/api/v1/admin)", () => {
    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });

    it("should return 403 when STUDENT attempts to access admin stats", async () => {
      const res = await request(app)
        .get("/api/v1/admin/stats")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe("fail");
    });

    it("should return 403 when SUPERVISOR attempts to access admin stats", async () => {
      const res = await request(app)
        .get("/api/v1/admin/stats")
        .set("Authorization", `Bearer ${supervisorToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("Project Route Restrictions (/api/v1/projects)", () => {
    it("should return 403 when SUPERVISOR tries to call student-only create endpoint", async () => {
      const res = await request(app)
        .post("/api/v1/projects/create")
        .set("Authorization", `Bearer ${supervisorToken}`)
        .send({ title: "Test Project" });

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe("fail");
    });

    it("should return 403 when STUDENT tries to access /supervised route", async () => {
      const res = await request(app)
        .get("/api/v1/projects/supervised")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe("fail");
    });
  });
});
