// src/schemas/executeSchema.ts
import { z } from "zod";

export const executeCodeSchema = z.object({
  body: z
    .object({
      engine: z.string().optional().default("python"),
      language: z.string().optional(),
      sourceCode: z.string().optional(),
      selectedFilePath: z.string().optional().default("main.py"),
      files: z
        .array(
          z.object({
            name: z.string().optional(),
            path: z.string().optional(),
            content: z.string().optional(),
            isFolder: z.boolean().optional(),
          })
        )
        .optional(),
      stdin: z.string().optional().default(""),
      expectedOutput: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.files !== undefined && data.files.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one file must be provided",
          path: ["files"],
        });
        return;
      }
      if (
        (!data.files || data.files.length === 0) &&
        (!data.sourceCode || data.sourceCode.trim().length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Either sourceCode string or files array must be provided",
          path: ["sourceCode"],
        });
      }
    }),
});

