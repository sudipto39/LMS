// src/schemas/signInSchema.ts
import { z } from "zod";

export const signInSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .toLowerCase(),

    password: z
      .string()
      .min(1, "Password is required"),
  }),
});

export type SignInInput = z.infer<typeof signInSchema>["body"];