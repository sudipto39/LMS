// src/services/judge0Service.ts
import axios, { AxiosError } from "axios";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

// Standard Judge0 Language IDs
export const JUDGE0_LANGUAGE_MAP: Record<string, number> = {
  python: 71,     // Python 3.8.1 / 3.11
  javascript: 63, // Node.js
  node: 63,       // Node.js alias
  java: 62,       // Java OpenJDK
  cpp: 54,        // C++ GCC
  c: 50,          // C GCC
  typescript: 74, // TypeScript
  go: 60,         // Go
  rust: 73,       // Rust
};

export interface FilePayload {
  name: string;
  path: string;
  content?: string;
  isFolder?: boolean;
}

export interface ExecuteOptions {
  engine: string;
  selectedFilePath: string;
  files: FilePayload[];
  stdin?: string | undefined;
  expectedOutput?: string | undefined;
  cpuTimeLimit?: number | undefined;
  memoryLimitKb?: number | undefined;
}

export interface Judge0Response {
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  status: {
    id: number; // 3 = Accepted, 4 = Wrong Answer, 5 = Time Limit Exceeded, 6 = Compilation Error, 7-12 = Runtime Error
    description: string;
  };
  time: string | null;
  memory: number | null;
  exitCode: number;
}

const judge0Client = axios.create({
  baseURL: env.JUDGE0_URL,
  headers: {
    "Content-Type": "application/json",
    ...(env.JUDGE0_AUTH_TOKEN
      ? { Authorization: `Bearer ${env.JUDGE0_AUTH_TOKEN}` }
      : {}),
  },
  timeout: 20000,
});

/**
 * Multi-file bundler: Prepares single entry point source code from workspace files
 */
function bundleSourceCode(
  engine: string,
  selectedPath: string,
  files: FilePayload[]
): string {
  const codeFiles = files.filter(
    (f) => !f.isFolder && f.content !== undefined
  );
  if (codeFiles.length === 0) return "";

  const foundFile = codeFiles.find(
    (f) =>
      f.path.toLowerCase() === selectedPath.toLowerCase() ||
      f.name.toLowerCase() === selectedPath.toLowerCase()
  );
  const primaryFile = foundFile ?? codeFiles[0];
  if (!primaryFile) return "";

  const engineLower = engine.toLowerCase();
  const primaryPath = primaryFile.path;
  const primaryName = primaryFile.name;
  const primaryContent = primaryFile.content || "";

  // Python multi-file bundling
  if (engineLower === "python") {
    const helperFiles = codeFiles.filter((f) => f.path !== primaryPath);
    let combined = "# ─── Workspace Helper Modules ───\n";
    for (const h of helperFiles) {
      combined += `# File: ${h.name}\n${h.content || ""}\n\n`;
    }
    combined += `# ─── Main Script Entry (${primaryName}) ───\n${primaryContent}`;
    return combined;
  }

  // Java multi-file bundling
  if (engineLower === "java") {
    const mainClassMatch = primaryContent.match(/public\s+class\s+(\w+)/);
    const mainClassName = mainClassMatch ? mainClassMatch[1] : "Main";

    const helperFiles = codeFiles.filter((f) => f.path !== primaryPath);
    let combined = "";
    for (const h of helperFiles) {
      // Remove 'public' from helper class definitions in Java single-file submission
      const sanitized = (h.content || "").replace(/public\s+class\s+/g, "class ");
      combined += `// File: ${h.name}\n${sanitized}\n\n`;
    }
    combined += `// Main Entry Class (${mainClassName})\n${primaryContent}`;
    return combined;
  }

  // C++ / C bundling
  if (engineLower === "cpp" || engineLower === "c") {
    const helperFiles = codeFiles.filter((f) => f.path !== primaryPath);
    let combined = "// ─── Included Header & Helper Files ───\n";
    for (const h of helperFiles) {
      combined += `// File: ${h.name}\n${h.content || ""}\n\n`;
    }
    combined += `// ─── Main Entry ───\n${primaryContent}`;
    return combined;
  }

  // JavaScript / Node bundling
  if (engineLower === "javascript" || engineLower === "node") {
    const helperFiles = codeFiles.filter((f) => f.path !== primaryPath);
    let combined = "// ─── Helper Modules ───\n";
    for (const h of helperFiles) {
      combined += `// File: ${h.name}\n${h.content || ""}\n\n`;
    }
    combined += `// ─── Main Entry (${primaryName}) ───\n${primaryContent}`;
    return combined;
  }

  return primaryContent;
}

export const judge0Service = {
  async executeCode(options: ExecuteOptions): Promise<Judge0Response> {
    const {
      engine,
      selectedFilePath,
      files,
      stdin = "",
      expectedOutput,
      cpuTimeLimit = 5,
      memoryLimitKb = 128000,
    } = options;

    const languageId = JUDGE0_LANGUAGE_MAP[engine.toLowerCase()] || 71;
    const sourceCode = bundleSourceCode(engine, selectedFilePath, files);

    if (!sourceCode.trim()) {
      throw new AppError("No executable source code found in workspace", 400);
    }

    try {
      // Send synchronous execution request with ?wait=true
      const res = await judge0Client.post<any>("/submissions?wait=true", {
        language_id: languageId,
        source_code: sourceCode,
        stdin,
        expected_output: expectedOutput || null,
        cpu_time_limit: cpuTimeLimit,
        memory_limit: memoryLimitKb,
      });

      const data = res.data;

      const statusId = data.status?.id ?? 3;
      const statusDescription = data.status?.description ?? "Completed";
      const exitCode = statusId === 3 ? 0 : 1;

      return {
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        compileOutput: data.compile_output || "",
        message: data.message || "",
        status: {
          id: statusId,
          description: statusDescription,
        },
        time: data.time ? `${(parseFloat(data.time) * 1000).toFixed(0)}ms` : null,
        memory: data.memory ? Math.round(data.memory / 1024) : null,
        exitCode,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const msg = error.response?.data?.error || error.message || "Judge0 server unavailable";
        console.error("❌ Judge0 API Error:", msg);
        throw new AppError(`Code Execution Engine offline: ${msg}`, 503);
      }
      throw new AppError("Failed to execute code on Judge0 server", 500);
    }
  },

  async getSupportedLanguages() {
    try {
      const res = await judge0Client.get("/languages");
      return res.data;
    } catch {
      return Object.entries(JUDGE0_LANGUAGE_MAP).map(([name, id]) => ({
        id,
        name: name.toUpperCase(),
      }));
    }
  },
};
