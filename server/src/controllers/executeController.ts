// src/controllers/executeController.ts
import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { BadRequestError } from "../utils/appError.js";
import { judge0Service, type FilePayload } from "../services/judge0Service.js";
import { redis } from "../config/redis.js";
import { requireParam } from "../utils/requireParam.js";

const MAX_TOTAL_PAYLOAD_BYTES = 50 * 1024; // 50 KB limit
const RATE_LIMIT_WINDOW_SEC = 60;
const MAX_RUNS_PER_WINDOW = 20;

export const executeCode = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  let {
    engine,
    language,
    sourceCode,
    selectedFilePath,
    files = [],
    stdin = "",
    expectedOutput,
  } = req.body as {
    engine?: string;
    language?: string;
    sourceCode?: string;
    selectedFilePath?: string;
    files?: FilePayload[];
    stdin?: string;
    expectedOutput?: string;
  };

  const selectedEngine = (engine || language || "python").toLowerCase();
  const extMap: Record<string, string> = {
    python: "py",
    javascript: "js",
    node: "js",
    typescript: "ts",
    cpp: "cpp",
    c: "c",
    java: "java",
    go: "go",
    rust: "rs",
    r: "r",
  };
  const fileExt = extMap[selectedEngine] || "txt";
  const defaultPath = selectedFilePath || `main.${fileExt}`;

  // If client provided sourceCode directly, construct files array
  if ((!files || files.length === 0) && typeof sourceCode === "string") {
    files = [
      {
        name: defaultPath,
        path: defaultPath,
        content: sourceCode,
      },
    ];
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw new BadRequestError("Source code or files array is required for execution");
  }

  // Cap number of files to prevent memory DoS from thousands of tiny files (FLAW-R2-11)
  const MAX_FILE_COUNT = 50;
  if (files.length > MAX_FILE_COUNT) {
    throw new BadRequestError(`Too many files submitted. Maximum ${MAX_FILE_COUNT} files allowed per execution.`);
  }

  const totalBytes = files.reduce(
    (acc, f) => acc + (f.content ? Buffer.byteLength(f.content, "utf8") : 0),
    0
  );
  if (totalBytes > MAX_TOTAL_PAYLOAD_BYTES) {
    throw new BadRequestError(
      `Payload size exceeds maximum allowed size of 50KB (${Math.round(
        totalBytes / 1024
      )}KB provided)`
    );
  }

  try {
    const redisKey = `ratelimit:execute:${userId}`;
    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.expire(redisKey, RATE_LIMIT_WINDOW_SEC);
    }
    if (current > MAX_RUNS_PER_WINDOW) {
      res.status(429).json({
        status: "fail",
        message: `Execution rate limit exceeded. Max ${MAX_RUNS_PER_WINDOW} runs per minute allowed.`,
      });
      return;
    }
  } catch {
    // Ignore Redis connection errors and continue
  }

  const result = await judge0Service.executeCode({
    engine: selectedEngine,
    selectedFilePath: defaultPath,
    files,
    stdin,
    expectedOutput,
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getLanguages = catchAsync(async (_req: Request, res: Response) => {
  const languages = await judge0Service.getSupportedLanguages();
  res.status(200).json({
    status: "success",
    data: languages,
  });
});

const CODE_TEMPLATES: Record<string, string> = {
  python: `# Python 3.10 Capstone Algorithm Template
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

if __name__ == "__main__":
    data = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
    target = 23
    result = binary_search(data, target)
    print(f"Index of {target}: {result}")
`,
  javascript: `// Node.js ES6 Template
function fibonacci(n) {
    const sequence = [0, 1];
    for (let i = 2; i < n; i++) {
        sequence.push(sequence[i - 1] + sequence[i - 2]);
    }
    return sequence;
}

console.log("Fibonacci Sequence (first 10 numbers):");
console.log(fibonacci(10).join(", "));
`,
  cpp: `// C++17 Template
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> nums = {45, 12, 85, 32, 89, 39, 69, 44, 42, 1, 6, 8};
    std::sort(nums.begin(), nums.end());
    
    std::cout << "Sorted array: ";
    for (int n : nums) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    return 0;
}
`,
  java: `// Java 17 Template
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] numbers = {10, 5, 8, 20, 15, 3};
        Arrays.sort(numbers);
        System.out.println("Sorted output: " + Arrays.toString(numbers));
    }
}
`,
  c: `// C Standard Template
#include <stdio.h>

int main() {
    printf("GiteaForge LMS Sandbox Remote Engine Online!\\n");
    return 0;
}
`,
  r: `# R 4.0.0 — Statistical Computing Template
# Generate sample normal data and calculate summary metrics
set.seed(42)
scores <- rnorm(20, mean = 78, sd = 10)
cat("=== Student Exam Score Distribution ===\n")
cat("Sample Size:", length(scores), "\n")
cat("Mean Score: ", round(mean(scores), 2), "\n")
cat("Std Dev:    ", round(sd(scores), 2), "\n")
cat("Summary:\n")
print(summary(scores))
`,
};

export const getCodeTemplate = catchAsync(async (req: Request, res: Response) => {
  const rawLanguage = requireParam(req.params["language"], "language").toLowerCase().trim();

  // FLAW-13: Whitelist language — return 400 for unknown rather than reflecting arbitrary input
  if (!Object.prototype.hasOwnProperty.call(CODE_TEMPLATES, rawLanguage)) {
    throw new BadRequestError(
      `Unknown language '${rawLanguage}'. Supported: ${Object.keys(CODE_TEMPLATES).join(", ")}`
    );
  }

  const language = rawLanguage as keyof typeof CODE_TEMPLATES;
  const template = CODE_TEMPLATES[language];

  res.status(200).json({
    status: "success",
    data: {
      language,
      template,
    },
  });
});
