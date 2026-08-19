// src/schemas/signUpSchema.ts
import { z } from "zod";

export const signUpSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters"),

    universityId: z
      .string()
      .min(1, "University ID is required"),

    email: z
      .string()
      .email("Invalid email address")
      .toLowerCase(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character"
      ),

    phoneNumber: z
      .string()
      .length(10, "Phone number must be 10 digits")
      .regex(/^\d{10}$/, "Phone number must contain only digits"),

    department: z
      .string()
      .min(2, "Department must be at least 2 characters"),

    role: z
      .enum(["STUDENT"])
      .optional()
      .default("STUDENT"),

    // Batch enrollment — optional at registration
    // Course is derived from batch
    batchId: z.string().optional(),
  }),
});

export type SignUpInput = z.infer<typeof signUpSchema>["body"];