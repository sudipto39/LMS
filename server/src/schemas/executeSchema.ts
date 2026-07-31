// src/schemas/executeSchema.ts
import { z } from "zod";

export const executeCodeSchema = z.object({
  body: z.object({
    engine: z.string().min(1, "Engine is required").default("python"),
    selectedFilePath: z.string().min(1, "Selected file path is required"),
    files: z
      .array(
        z.object({
          name: z.string(),
          path: z.string(),
          content: z.string().optional(),
          isFolder: z.boolean().optional(),
        })
      )
      .min(1, "At least one file must be provided"),
    stdin: z.string().optional().default(""),
    expectedOutput: z.string().optional(),
  }),
});
