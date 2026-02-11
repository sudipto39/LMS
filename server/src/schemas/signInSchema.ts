import { regex, z } from "zod";

export const signInValidation = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .regex(
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
    ),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});
