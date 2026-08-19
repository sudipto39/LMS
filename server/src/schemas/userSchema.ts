// src/schemas/userSchema.ts
import { z } from "zod";

export const updateMeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters")
      .optional(),
    phoneNumber: z
      .string()
      .length(10, "Phone number must be 10 digits")
      .regex(/^\d{10}$/, "Phone number must contain only digits")
      .optional(),
    department: z
      .string()
      .min(2, "Department must be at least 2 characters")
      .max(100, "Department must be at most 100 characters")
      .optional(),
  }),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>["body"];
