import { signUpSchema } from "../schemas/signUpSchema.js";
import { verifyEmailSchema, resetPasswordSchema } from "../schemas/verifySchema.js";
import { executeCodeSchema } from "../schemas/executeSchema.js";

describe("Zod Input Validation Schema Unit Tests", () => {
  describe("signUpSchema", () => {
    it("should accept a valid student registration payload", () => {
      const validPayload = {
        body: {
          name: "Alice Johnson",
          universityId: "UNI-2026-001",
          email: "alice@university.edu",
          password: "SecurePassword123!",
          phoneNumber: "9876543210",
          department: "Computer Science",
          role: "STUDENT",
        },
      };

      const result = signUpSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invalidPayload = {
        body: {
          name: "Alice Johnson",
          universityId: "UNI-2026-001",
          email: "not-a-valid-email",
          password: "SecurePassword123!",
          phoneNumber: "9876543210",
          department: "Computer Science",
        },
      };

      const result = signUpSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Invalid email address");
      }
    });

    it("should reject phone number that is not exactly 10 digits", () => {
      const invalidPayload = {
        body: {
          name: "Alice Johnson",
          universityId: "UNI-2026-001",
          email: "alice@university.edu",
          password: "SecurePassword123!",
          phoneNumber: "12345",
          department: "Computer Science",
        },
      };

      const result = signUpSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Phone number must be 10 digits");
      }
    });

    it("should reject passwords lacking uppercase or special characters", () => {
      const invalidPayload = {
        body: {
          name: "Alice Johnson",
          universityId: "UNI-2026-001",
          email: "alice@university.edu",
          password: "lowercasepassword123",
          phoneNumber: "9876543210",
          department: "Computer Science",
        },
      };

      const result = signUpSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("verifyEmailSchema & resetPasswordSchema", () => {
    it("should reject OTP codes that are not 6 digits", () => {
      const invalidOtp = {
        body: {
          email: "test@example.com",
          code: "1234",
        },
      };

      const result = verifyEmailSchema.safeParse(invalidOtp);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Verification code must be exactly 6 characters");
      }
    });

    it("should reject password reset when password and confirmPassword do not match", () => {
      const mismatchPayload = {
        params: { token: "valid-reset-token-123" },
        body: {
          password: "NewPassword123!",
          confirmPassword: "DifferentPassword123!",
        },
      };

      const result = resetPasswordSchema.safeParse(mismatchPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Passwords do not match");
      }
    });
  });

  describe("executeCodeSchema", () => {
    it("should reject execute request with empty files array", () => {
      const emptyFilesPayload = {
        body: {
          engine: "python",
          selectedFilePath: "main.py",
          files: [],
        },
      };

      const result = executeCodeSchema.safeParse(emptyFilesPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("At least one file must be provided");
      }
    });
  });
});
