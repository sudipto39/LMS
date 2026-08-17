import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { signAccessToken } from "../utils/createSendToken.js";
import { prisma } from "../config/db.js";

describe("Milestone Workflow State Machine Tests", () => {
  const studentId = "student-owner-123";
  const otherStudentId = "student-intruder-456";
  const supervisorId = "supervisor-assigned-789";

  const studentToken = signAccessToken(studentId, "STUDENT");
  const otherStudentToken = signAccessToken(otherStudentId, "STUDENT");
  const supervisorToken = signAccessToken(supervisorId, "SUPERVISOR");

  beforeEach(() => {
    jest.spyOn(prisma.user, "findUnique").mockImplementation((args: any) => {
      const id = args.where?.id;
      if (id === studentId) {
        return Promise.resolve({ id: studentId, role: "STUDENT", isEmailVerified: true } as any);
      }
      if (id === otherStudentId) {
        return Promise.resolve({ id: otherStudentId, role: "STUDENT", isEmailVerified: true } as any);
      }
      if (id === supervisorId) {
        return Promise.resolve({ id: supervisorId, role: "SUPERVISOR", isEmailVerified: true } as any);
      }
      return Promise.resolve(null);
    });

    jest.spyOn(prisma.activity, "create").mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("PATCH /api/v1/milestones/:id/submit", () => {
    it("should allow student owner to submit milestone in progress", async () => {
      jest.spyOn(prisma.milestone, "findUnique").mockResolvedValue({
        id: "ms-1",
        title: "Milestone 1",
        status: "IN_PROGRESS",
        projectId: "proj-1",
        project: { ownerId: studentId, id: "proj-1" },
      } as any);

      jest.spyOn(prisma.milestone, "update").mockResolvedValue({
        id: "ms-1",
        status: "SUBMITTED",
        submittedById: studentId,
      } as any);

      const res = await request(app)
        .patch("/api/v1/milestones/ms-1/submit")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ studentNotes: "Completed milestone features" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("SUBMITTED");
    });

    it("should reject submission if milestone is already APPROVED", async () => {
      jest.spyOn(prisma.milestone, "findUnique").mockResolvedValue({
        id: "ms-1",
        status: "APPROVED",
        project: { ownerId: studentId, id: "proj-1" },
      } as any);

      const res = await request(app)
        .patch("/api/v1/milestones/ms-1/submit")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Milestone already approved");
    });

    it("should reject submission if milestone is already SUBMITTED and pending review", async () => {
      jest.spyOn(prisma.milestone, "findUnique").mockResolvedValue({
        id: "ms-1",
        status: "SUBMITTED",
        project: { ownerId: studentId, id: "proj-1" },
      } as any);

      const res = await request(app)
        .patch("/api/v1/milestones/ms-1/submit")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Milestone already submitted and awaiting review");
    });

    it("should return 403 when non-owner student attempts to submit milestone", async () => {
      jest.spyOn(prisma.milestone, "findUnique").mockResolvedValue({
        id: "ms-1",
        status: "IN_PROGRESS",
        project: { ownerId: studentId, id: "proj-1" },
      } as any);

      const res = await request(app)
        .patch("/api/v1/milestones/ms-1/submit")
        .set("Authorization", `Bearer ${otherStudentToken}`)
        .send({});

      expect(res.statusCode).toBe(403);
    });
  });

  describe("PATCH /api/v1/milestones/:id/approve & /reject", () => {
    it("should allow assigned supervisor to APPROVE milestone", async () => {
      jest.spyOn(prisma.milestone, "findUnique").mockResolvedValue({
        id: "ms-1",
        title: "Milestone 1",
        projectId: "proj-1",
        project: { supervisorId },
      } as any);

      jest.spyOn(prisma.milestone, "update").mockResolvedValue({
        id: "ms-1",
        status: "APPROVED",
        feedback: "Great job!",
        reviewedById: supervisorId,
      } as any);

      const res = await request(app)
        .patch("/api/v1/milestones/ms-1/approve")
        .set("Authorization", `Bearer ${supervisorToken}`)
        .send({ feedback: "Great job!" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("APPROVED");
    });

    it("should allow assigned supervisor to REJECT milestone with feedback", async () => {
      jest.spyOn(prisma.milestone, "findUnique").mockResolvedValue({
        id: "ms-1",
        title: "Milestone 1",
        projectId: "proj-1",
        project: { supervisorId },
      } as any);

      jest.spyOn(prisma.milestone, "update").mockResolvedValue({
        id: "ms-1",
        status: "REJECTED",
        feedback: "Please add unit tests and resubmit.",
        reviewedById: supervisorId,
      } as any);

      const res = await request(app)
        .patch("/api/v1/milestones/ms-1/reject")
        .set("Authorization", `Bearer ${supervisorToken}`)
        .send({ feedback: "Please add unit tests and resubmit." });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("REJECTED");
    });
  });
});
