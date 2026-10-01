import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { signAccessToken } from "../utils/createSendToken.js";
import { prisma } from "../config/db.js";

describe("Security Hardening Regression Tests", () => {
  const studentId = "student-sec-1";
  const studentToken = signAccessToken(studentId, "STUDENT");

  beforeEach(() => {
    (jest.spyOn(prisma.user, "findUnique") as any).mockImplementation((args: any) => {
      const id = args.where?.id;
      if (id === studentId) {
        return Promise.resolve({
          id: studentId,
          role: "STUDENT",
          isEmailVerified: true,
          giteaUsername: "student-sec-1",
        } as any);
      }
      if (id === "supervisor-sec-1") {
        return Promise.resolve({
          id: "supervisor-sec-1",
          role: "SUPERVISOR",
          isEmailVerified: true,
          giteaUsername: "supervisor-sec-1",
        } as any);
      }
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("File Download Authentication & Security Headers", () => {
    it("should return 401 Unauthorized when attempting to download uploaded file without authentication", async () => {
      const res = await request(app).get("/api/v1/uploads/files/nonexistent.pdf");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("Double-Submit CSRF Protection", () => {
    it("should reject mutating request when browser cookie is present but CSRF header is missing", async () => {
      const res = await request(app)
        .patch("/api/v1/users/updateMe")
        .set("Cookie", ["refreshToken=mock-refresh-token", "csrfToken=valid-csrf-token-1234567890"])
        .send({ name: "Hacked Name" });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain("Invalid or missing CSRF token");
    });

    it("should reject mutating request when CSRF token header does not match cookie", async () => {
      const res = await request(app)
        .patch("/api/v1/users/updateMe")
        .set("Cookie", ["csrfToken=token-a"])
        .set("X-CSRF-Token", "token-b")
        .send({ name: "Hacked Name" });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain("Invalid or missing CSRF token");
    });
  });

  describe("Refresh Token Cryptographic Hashing", () => {
    it("should hash refresh tokens using SHA-256 and verify matches correctly", async () => {
      const { hashToken, matchesRefreshToken } = await import("../utils/createSendToken.js");
      const rawToken = "my-secret-refresh-token-123456";
      const hashed = hashToken(rawToken);

      expect(hashed).toHaveLength(64); // SHA-256 hex string
      expect(hashed).not.toEqual(rawToken);
      expect(matchesRefreshToken(hashed, rawToken)).toBe(true);
      expect(matchesRefreshToken(hashed, "wrong-token")).toBe(false);
    });
  });

  describe("Lab Assignment Submissions Protection (IDOR Prevention)", () => {
    it("should strip other students' submissions from GET /api/v1/lab-assignments/:id response", async () => {
      jest.spyOn(prisma.batchEnrollment, "findUnique").mockResolvedValue({
        userId: studentId,
        batchId: "batch-1",
      } as any);

      const mockOtherStudentSubmission = {
        id: "sub-victim",
        studentId: "student-victim",
        code: "print('confidential solution')",
        score: 100,
      };

      const mockMySubmission = {
        id: "sub-me",
        studentId: studentId,
        code: "print('my work')",
        score: 90,
      };

      jest.spyOn(prisma.labAssignment, "findUnique").mockResolvedValue({
        id: "lab-1",
        title: "Data Structures Lab 1",
        batchId: "batch-1",
        creatorId: "prof-1",
        testCases: [],
        batch: { id: "batch-1", name: "CS2026" },
        creator: { id: "prof-1", name: "Prof", email: "prof@univ.edu" },
        submissions: [mockOtherStudentSubmission, mockMySubmission],
      } as any);

      const res = await request(app)
        .get("/api/v1/lab-assignments/lab-1")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      // Critical check: submissions list must NOT be leaked to student
      expect(res.body.data.submissions).toBeUndefined();
      // Student only receives their own submission
      expect(res.body.data.mySubmissions).toHaveLength(1);
      expect(res.body.data.mySubmissions[0].id).toBe("sub-me");
    });
  });

  describe("File Upload Magic Byte & Archive Path Traversal Validation", () => {
    it("should validate safe archive entries and reject path traversal attempts", async () => {
      const { isSafeArchiveEntry } = await import("../middlewares/fileUploadMiddleware.js");
      expect(isSafeArchiveEntry("src/index.js")).toBe(true);
      expect(isSafeArchiveEntry("components/Header.tsx")).toBe(true);
      expect(isSafeArchiveEntry("../etc/passwd")).toBe(false);
      expect(isSafeArchiveEntry("..\\windows\\system32")).toBe(false);
      expect(isSafeArchiveEntry("/absolute/path")).toBe(false);
    });
  });

  describe("Supervisor Project Rubric Evaluation (BOLA Prevention)", () => {
    it("should return 403 Forbidden when a supervisor attempts to evaluate an unassigned project", async () => {
      const supervisorId = "supervisor-sec-1";
      const supervisorToken = signAccessToken(supervisorId, "SUPERVISOR");

      jest.spyOn(prisma.project, "findUnique").mockResolvedValue({
        id: "proj-unassigned",
        supervisorId: "different-supervisor-id",
      } as any);

      const res = await request(app)
        .patch("/api/v1/supervisors/projects/proj-unassigned/grade")
        .set("Authorization", `Bearer ${supervisorToken}`)
        .send({ score: 95, feedback: "Attempted tampering" });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain("Only the assigned supervisor or an administrator");
    });
  });

  describe("Folder Operation Constraints & Mass Erasure Prevention", () => {
    it("should reject deleteSubjectFolder when batchId is missing", async () => {
      const supervisorId = "supervisor-sec-1";
      const supervisorToken = signAccessToken(supervisorId, "SUPERVISOR");

      const res = await request(app)
        .post("/api/v1/lab-assignments/folders/delete")
        .set("Authorization", `Bearer ${supervisorToken}`)
        .send({ subject: "General Programming" }); // Missing batchId

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Batch ID is required");
    });
  });

  describe("Lab Submission Payload Limits & Size Guards", () => {
    it("should reject lab code submission that exceeds 50KB payload limit", async () => {
      jest.spyOn(prisma.labAssignment, "findUnique").mockResolvedValue({
        id: "lab-1",
        batchId: "batch-1",
      } as any);
      jest.spyOn(prisma.batchEnrollment, "findUnique").mockResolvedValue({
        userId: studentId,
        batchId: "batch-1",
      } as any);

      const giantCode = "A".repeat(60 * 1024); // 60KB

      const res = await request(app)
        .post("/api/v1/lab-assignments/lab-1/submit")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ code: giantCode, language: "python" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("size exceeds maximum allowed size of 50KB");
    });
  });

  describe("Cross-Project Feedback Hierarchy Isolation", () => {
    it("should reject feedback replies if parent feedback belongs to a different project", async () => {
      jest.spyOn(prisma.project, "findUnique").mockResolvedValue({
        id: "proj-1",
        ownerId: studentId,
        members: [],
      } as any);

      jest.spyOn(prisma.projectFeedback, "findUnique").mockResolvedValue({
        id: "feedback-victim",
        projectId: "proj-other-secret", // Mismatched project
      } as any);

      const res = await request(app)
        .post("/api/v1/projects/proj-1/feedback/feedback-victim/reply")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ content: "Malicious injection into external thread" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("does not belong to this project");
    });
  });

  describe("Project Git Diff Access Control (BOLA Prevention)", () => {
    it("should return 403 when an unauthorized student attempts to access git diff of another student's project", async () => {
      jest.spyOn(prisma.project, "findUnique").mockResolvedValue({
        id: "proj-victim",
        ownerId: "other-student-id",
        supervisorId: "supervisor-id",
        members: [],
      } as any);

      const res = await request(app)
        .get("/api/v1/projects/proj-victim/diff/HEAD")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain("permission to access this project");
    });
  });

  describe("Project Hierarchy & Extension Authorization", () => {
    it("should reject extension creation when student attempts to link to a parent project they do not own or belong to", async () => {
      const parentUuid = "c9bf9e57-1685-4c89-bafb-ff5af830be8a";
      const batchUuid = "d8b50bea-238a-49cc-81d3-883c11c40904";

      jest.spyOn(prisma.project, "findUnique").mockResolvedValue({
        id: parentUuid,
        ownerId: "other-student-id",
        members: [],
        phase: 1,
      } as any);

      const res = await request(app)
        .post("/api/v1/projects/create")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          title: "Hijacked Extension",
          parentProjectId: parentUuid,
          batchId: batchUuid,
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain("You can only extend a project that you own or are a member of");
    });
  });

  describe("Milestone Lifecycle Integrity", () => {
    it("should reject milestone deletion when milestone is in SUBMITTED state pending review", async () => {
      jest.spyOn(prisma.milestone, "findUnique").mockResolvedValue({
        id: "ms-submitted-1",
        status: "SUBMITTED",
        project: { ownerId: studentId },
      } as any);

      const res = await request(app)
        .delete("/api/v1/milestones/ms-submitted-1")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Cannot delete a milestone that has already been submitted");
    });
  });

  describe("SSH Key ID Parameter Sanitization", () => {
    it("should reject non-numeric SSH key IDs with HTTP 400", async () => {
      const res = await request(app)
        .delete("/api/v1/users/me/ssh-keys/malicious-path-traversal")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Invalid SSH key ID: must be a numeric identifier");
    });
  });

  describe("Refresh Token Rotation (RTR) Cookie Emission", () => {
    it("should issue a rotated refreshToken cookie on successful refresh", async () => {
      const { signRefreshToken } = await import("../utils/createSendToken.js");
      const validRefreshToken = signRefreshToken(studentId);

      (jest.spyOn(prisma.user, "findUnique") as any).mockImplementation((_args: any) => {
        return Promise.resolve({
          id: studentId,
          role: "STUDENT",
          isEmailVerified: true,
          refreshToken: validRefreshToken,
        } as any);
      });

      jest.spyOn(prisma.user, "update").mockResolvedValue({
        id: studentId,
        refreshToken: "mock-hash",
      } as any);

      const res = await request(app)
        .post("/api/v1/auth/refresh-token")
        .set("Cookie", [`refreshToken=${validRefreshToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.accessToken).toBeDefined();

      const setCookie = res.headers["set-cookie"] as string[] | undefined;
      expect(setCookie).toBeDefined();
      expect(setCookie?.[0]).toContain("refreshToken=");
      expect(setCookie?.[0]).toContain("SameSite=Lax");
    });
  });
});
