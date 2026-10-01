import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { signAccessToken } from "../utils/createSendToken.js";
import { prisma } from "../config/db.js";
import { upload } from "../middlewares/fileUploadMiddleware.js";
import { uploadToS3 } from "../middlewares/uploadMiddleware.js";

describe("File Upload Validation Tests", () => {
  const supervisorToken = signAccessToken("supervisor-1", "SUPERVISOR");

  beforeEach(() => {
    (jest.spyOn(prisma.user, "findUnique") as any).mockImplementation((args: any) => {
      const id = args.where?.id;
      if (id === "student-1") {
        return Promise.resolve({
          id: "student-1",
          role: "STUDENT",
          isEmailVerified: true,
        } as any);
      }
      if (id === "supervisor-1") {
        return Promise.resolve({
          id: "supervisor-1",
          role: "SUPERVISOR",
          isEmailVerified: true,
        } as any);
      }
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Presigned Download URLs (/api/v1/uploads/presigned)", () => {
    it("should return 401 when accessing presigned download URL without authentication", async () => {
      const res = await request(app).get("/api/v1/uploads/presigned/test-file.pdf");
      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("Milestone Submission Upload Restrictions", () => {
    it("should return 403 when SUPERVISOR tries to submit files to student milestone endpoint", async () => {
      const res = await request(app)
        .patch("/api/v1/milestones/ms-123/submit")
        .set("Authorization", `Bearer ${supervisorToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("Multer File Filter Validation Logic", () => {
    it("should allow valid PDF, PNG, and ZIP mime types in fileUploadMiddleware", (done) => {
      const filter = (upload as any).fileFilter;
      const validFiles = [
        { mimetype: "application/pdf", originalname: "document.pdf" },
        { mimetype: "image/png", originalname: "diagram.png" },
        { mimetype: "image/jpeg", originalname: "photo.jpg" },
        { mimetype: "application/zip", originalname: "project.zip" },
      ];

      let count = 0;
      validFiles.forEach((file) => {
        filter({} as any, file as any, (err: any, accepted: boolean) => {
          expect(err).toBeNull();
          expect(accepted).toBe(true);
          count++;
          if (count === validFiles.length) done();
        });
      });
    });

    it("should reject executable or unsafe file mime types with AppError", (done) => {
      const filter = (upload as any).fileFilter;
      const unsafeFiles = [
        { mimetype: "application/x-msdownload", originalname: "virus.exe" },
        { mimetype: "text/html", originalname: "hack.html" },
        { mimetype: "application/x-sh", originalname: "script.sh" },
      ];

      let count = 0;
      unsafeFiles.forEach((file) => {
        filter({} as any, file as any, (err: any, accepted: boolean) => {
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(400);
          expect(err.message).toContain("Only PDF");
          expect(accepted).toBeFalsy();
          count++;
          if (count === unsafeFiles.length) done();
        });
      });
    });

    it("should validate allowed file extensions in uploadToS3 middleware", (done) => {
      const filter = (uploadToS3 as any).fileFilter;
      const allowedFile = { mimetype: "application/pdf", originalname: "report.pdf" };

      filter({} as any, allowedFile as any, (err: any, accepted: boolean) => {
        expect(err).toBeNull();
        expect(accepted).toBe(true);
        done();
      });
    });

    it("should reject disallowed extensions in uploadToS3 middleware", (done) => {
      const filter = (uploadToS3 as any).fileFilter;
      const disallowedFile = { mimetype: "application/x-bat", originalname: "malware.bat" };

      filter({} as any, disallowedFile as any, (err: any, _accepted: boolean) => {
        expect(err).toBeDefined();
        expect(err.message).toContain("Invalid file type");
        done();
      });
    });
  });
});
