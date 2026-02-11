import { z } from "zod";

export const signUpValidation = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .regex(
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
    ),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  phoneNumber: z.string().length(10, "Phone number must be 10 digits long"),
  department: z
    .string()
    .min(2, "Department must be at least 2 characters long"),
  yearOfStudy: z
    .number()
    .int()
    .min(1, "Year of study must be at least 1")
    .max(5, "Year of study must be at most 5"),
});
