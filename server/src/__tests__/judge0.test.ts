import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { signAccessToken } from "../utils/createSendToken.js";
import { prisma } from "../config/db.js";
import { judge0Service } from "../services/judge0Service.js";
import { AppError } from "../utils/appError.js";

describe("Judge0 Code Execution Integration & Resilience Tests", () => {
  const studentToken = signAccessToken("student-1", "STUDENT");

  beforeEach(() => {
    jest.spyOn(prisma.user, "findUnique").mockImplementation((args: any) => {
      const id = args.where?.id;
      if (id === "student-1") {
        return Promise.resolve({
          id: "student-1",
          role: "STUDENT",
          isEmailVerified: true,
        } as any);
      }
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/v1/execute (Endpoint Validation)", () => {
    it("should return 401 when calling execution endpoint without auth token", async () => {
      const res = await request(app)
        .post("/api/v1/execute")
        .send({
          engine: "python",
          selectedFilePath: "main.py",
          files: [{ name: "main.py", path: "main.py", content: "print('hi')" }],
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });

    it("should return 400 when missing required files array", async () => {
      const res = await request(app)
        .post("/api/v1/execute")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          engine: "python",
          selectedFilePath: "main.py",
          files: [],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });

    it("should return 400 when payload exceeds 50KB limit", async () => {
      const largeContent = "a".repeat(55 * 1024); // 55KB
      const res = await request(app)
        .post("/api/v1/execute")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          engine: "python",
          selectedFilePath: "main.py",
          files: [{ name: "main.py", path: "main.py", content: largeContent }],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Payload size exceeds maximum");
    });
  });

  describe("Judge0 Service Resilience & Error Handling", () => {
    it("should gracefully handle Judge0 timeout / server offline with 503 status", async () => {
      jest.spyOn(judge0Service, "executeCode").mockRejectedValue(
        new AppError("Code Execution Engine offline: connect ECONNREFUSED 127.0.0.1:2358", 503)
      );

      const res = await request(app)
        .post("/api/v1/execute")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          engine: "python",
          selectedFilePath: "main.py",
          files: [{ name: "main.py", path: "main.py", content: "print('test')" }],
        });

      expect(res.statusCode).toBe(503);
      expect(res.body.message).toContain("Code Execution Engine offline");
    });

    it("should return structured execution results when execution succeeds", async () => {
      jest.spyOn(judge0Service, "executeCode").mockResolvedValue({
        stdout: "Hello LMS!\n",
        stderr: "",
        compileOutput: "",
        message: "",
        status: { id: 3, description: "Accepted" },
        time: "45ms",
        memory: 1240,
        exitCode: 0,
      });

      const res = await request(app)
        .post("/api/v1/execute")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          engine: "python",
          selectedFilePath: "main.py",
          files: [{ name: "main.py", path: "main.py", content: "print('Hello LMS!')" }],
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.stdout).toBe("Hello LMS!\n");
      expect(res.body.data.exitCode).toBe(0);
    });

    it("GET /api/v1/execute/languages should return supported language list", async () => {
      const res = await request(app)
        .get("/api/v1/execute/languages")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
