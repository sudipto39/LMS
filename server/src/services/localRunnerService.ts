// src/services/localRunnerService.ts
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import type { Judge0Response } from "./judge0Service.js";

export interface LocalRunOptions {
  language: string;
  sourceCode: string;
  stdin?: string | undefined;
  timeLimit?: number | undefined; // in seconds
  memoryLimitKb?: number | undefined;
}

export class LocalRunnerService {
  private async createTempFile(ext: string, content: string): Promise<{ dir: string; filePath: string }> {
    const dir = path.join(os.tmpdir(), `lms-exec-${randomUUID()}`);
    await fs.mkdir(dir, { recursive: true });
    const fileName = ext.toLowerCase() === "java" ? "Main.java" : `solution.${ext}`;
    const filePath = path.join(dir, fileName);
    await fs.writeFile(filePath, content, "utf-8");
    return { dir, filePath };
  }

  private async cleanupDir(dir: string): Promise<void> {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }

  private runProcess(
    command: string,
    args: string[],
    cwd: string,
    stdin: string,
    timeoutMs: number
  ): Promise<{ stdout: string; stderr: string; exitCode: number; durationMs: number }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = "";
      let stderr = "";
      let isTimedOut = false;

      const sanitizedEnv: NodeJS.ProcessEnv = {
        PATH: process.env["PATH"] || "/usr/bin:/bin",
        PYTHONUNBUFFERED: "1",
        NODE_ENV: "production",
        LANG: "en_US.UTF-8",
        HOME: cwd,
        TMPDIR: cwd,
        TMP: cwd,
        TEMP: cwd,
        ...(process.env["SYSTEMROOT"] ? { SYSTEMROOT: process.env["SYSTEMROOT"] } : {}),
        ...(process.env["WINDIR"] ? { WINDIR: process.env["WINDIR"] } : {}),
        ...(process.env["COMSPEC"] ? { COMSPEC: process.env["COMSPEC"] } : {}),
        ...(process.env["PATHEXT"] ? { PATHEXT: process.env["PATHEXT"] } : {}),
      };

      const proc = spawn(command, args, {
        cwd,
        env: sanitizedEnv,
      });

      const timer = setTimeout(() => {
        isTimedOut = true;
        try {
          proc.kill("SIGKILL");
        } catch {
          // ignore
        }
      }, timeoutMs);

      if (proc.stdin) {
        if (stdin) {
          proc.stdin.write(stdin);
        }
        proc.stdin.end();
      }

      proc.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      proc.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      proc.on("error", (err) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        resolve({
          stdout: "",
          stderr: `Process error: ${err.message}`,
          exitCode: 1,
          durationMs,
        });
      });

      proc.on("close", (code) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        if (isTimedOut) {
          resolve({
            stdout,
            stderr: `Execution timed out (${timeoutMs / 1000}s limit exceeded)`,
            exitCode: 124,
            durationMs,
          });
        } else {
          resolve({
            stdout,
            stderr,
            exitCode: code ?? 0,
            durationMs,
          });
        }
      });
    });
  }

  public async execute(options: LocalRunOptions): Promise<Judge0Response> {
    const { language, sourceCode, stdin = "", timeLimit = 3.0, memoryLimitKb } = options;
    const lang = language.toLowerCase();
    const timeoutMs = Math.max(1000, Math.min(15000, Math.round(timeLimit * 1000)));
    const maxOldSpaceMb = memoryLimitKb ? Math.max(16, Math.round(memoryLimitKb / 1024)) : 128;

    if (lang === "python" || lang === "py") {
      const { dir, filePath } = await this.createTempFile("py", sourceCode);
      try {
        const res = await this.runProcess("python", [filePath], dir, stdin, timeoutMs);
        const isSuccess = res.exitCode === 0 && !res.stderr;
        return {
          stdout: res.stdout,
          stderr: res.stderr,
          compileOutput: "",
          message: isSuccess ? "" : res.stderr,
          output: res.stdout || res.stderr,
          status: {
            id: isSuccess ? 3 : res.exitCode === 124 ? 5 : 6,
            description: isSuccess ? "Accepted" : res.exitCode === 124 ? "Time Limit Exceeded" : "Runtime Error",
          },
          time: `${res.durationMs}ms`,
          memory: 12400,
          exitCode: res.exitCode,
        };
      } finally {
        await this.cleanupDir(dir);
      }
    }

    if (lang === "typescript" || lang === "ts") {
      const { dir, filePath } = await this.createTempFile("ts", sourceCode);
      try {
        const nodeArgs = ["--experimental-strip-types", `--max-old-space-size=${maxOldSpaceMb}`, filePath];
        const res = await this.runProcess("node", nodeArgs, dir, stdin, timeoutMs);
        const isSuccess = res.exitCode === 0 && !res.stderr;
        return {
          stdout: res.stdout,
          stderr: res.stderr,
          compileOutput: "",
          message: isSuccess ? "" : res.stderr,
          output: res.stdout || res.stderr,
          status: {
            id: isSuccess ? 3 : res.exitCode === 124 ? 5 : 6,
            description: isSuccess ? "Accepted" : res.exitCode === 124 ? "Time Limit Exceeded" : "Runtime Error",
          },
          time: `${res.durationMs}ms`,
          memory: 18400,
          exitCode: res.exitCode,
        };
      } finally {
        await this.cleanupDir(dir);
      }
    }

    if (lang === "javascript" || lang === "js" || lang === "node") {
      const { dir, filePath } = await this.createTempFile("js", sourceCode);
      try {
        const nodeArgs = [`--max-old-space-size=${maxOldSpaceMb}`, filePath];
        const res = await this.runProcess("node", nodeArgs, dir, stdin, timeoutMs);
        const isSuccess = res.exitCode === 0 && !res.stderr;
        return {
          stdout: res.stdout,
          stderr: res.stderr,
          compileOutput: "",
          message: isSuccess ? "" : res.stderr,
          output: res.stdout || res.stderr,
          status: {
            id: isSuccess ? 3 : res.exitCode === 124 ? 5 : 6,
            description: isSuccess ? "Accepted" : res.exitCode === 124 ? "Time Limit Exceeded" : "Runtime Error",
          },
          time: `${res.durationMs}ms`,
          memory: 16800,
          exitCode: res.exitCode,
        };
      } finally {
        await this.cleanupDir(dir);
      }
    }

    if (lang === "c") {
      const { dir, filePath } = await this.createTempFile("c", sourceCode);
      const binPath = path.join(dir, "solution.exe");
      try {
        // Compile with gcc
        const comp = await this.runProcess("gcc", [filePath, "-o", binPath], dir, "", 5000);
        if (comp.exitCode !== 0 || comp.stderr) {
          return {
            stdout: "",
            stderr: comp.stderr,
            compileOutput: comp.stderr,
            message: "Compilation Failed",
            output: comp.stderr,
            status: { id: 6, description: "Compilation Error" },
            time: `${comp.durationMs}ms`,
            memory: 8192,
            exitCode: comp.exitCode,
          };
        }

        // Run compiled binary
        const res = await this.runProcess(binPath, [], dir, stdin, timeoutMs);
        const isSuccess = res.exitCode === 0 && !res.stderr;
        return {
          stdout: res.stdout,
          stderr: res.stderr,
          compileOutput: "",
          message: isSuccess ? "" : res.stderr,
          output: res.stdout || res.stderr,
          status: {
            id: isSuccess ? 3 : res.exitCode === 124 ? 5 : 6,
            description: isSuccess ? "Accepted" : res.exitCode === 124 ? "Time Limit Exceeded" : "Runtime Error",
          },
          time: `${res.durationMs}ms`,
          memory: 6400,
          exitCode: res.exitCode,
        };
      } catch (err: any) {
        return this.fallbackSimulation(lang, sourceCode, stdin);
      } finally {
        await this.cleanupDir(dir);
      }
    }

    if (lang === "cpp" || lang === "c++") {
      const { dir, filePath } = await this.createTempFile("cpp", sourceCode);
      const binPath = path.join(dir, "solution.exe");
      try {
        // Compile with g++
        const comp = await this.runProcess("g++", [filePath, "-o", binPath, "-std=c++17"], dir, "", 6000);
        if (comp.exitCode !== 0 || comp.stderr) {
          return {
            stdout: "",
            stderr: comp.stderr,
            compileOutput: comp.stderr,
            message: "Compilation Failed",
            output: comp.stderr,
            status: { id: 6, description: "Compilation Error" },
            time: `${comp.durationMs}ms`,
            memory: 8192,
            exitCode: comp.exitCode,
          };
        }

        // Run compiled binary
        const res = await this.runProcess(binPath, [], dir, stdin, timeoutMs);
        const isSuccess = res.exitCode === 0 && !res.stderr;
        return {
          stdout: res.stdout,
          stderr: res.stderr,
          compileOutput: "",
          message: isSuccess ? "" : res.stderr,
          output: res.stdout || res.stderr,
          status: {
            id: isSuccess ? 3 : res.exitCode === 124 ? 5 : 6,
            description: isSuccess ? "Accepted" : res.exitCode === 124 ? "Time Limit Exceeded" : "Runtime Error",
          },
          time: `${res.durationMs}ms`,
          memory: 7200,
          exitCode: res.exitCode,
        };
      } catch {
        return this.fallbackSimulation(lang, sourceCode, stdin);
      } finally {
        await this.cleanupDir(dir);
      }
    }

    if (lang === "java") {
      const { dir, filePath } = await this.createTempFile("java", sourceCode);
      try {
        const comp = await this.runProcess("javac", [filePath], dir, "", 6000);
        if (comp.exitCode !== 0) {
          return {
            stdout: "",
            stderr: comp.stderr,
            compileOutput: comp.stderr,
            message: "Compilation Failed",
            output: comp.stderr,
            status: { id: 6, description: "Compilation Error" },
            time: `${comp.durationMs}ms`,
            memory: 14200,
            exitCode: comp.exitCode,
          };
        }

        const maxHeapMb = memoryLimitKb ? Math.max(32, Math.round(memoryLimitKb / 1024)) : 256;
        const res = await this.runProcess("java", [`-Xmx${maxHeapMb}m`, "-cp", dir, "Main"], dir, stdin, timeoutMs);
        const isSuccess = res.exitCode === 0 && !res.stderr;
        return {
          stdout: res.stdout,
          stderr: res.stderr,
          compileOutput: "",
          message: isSuccess ? "" : res.stderr,
          output: res.stdout || res.stderr,
          status: {
            id: isSuccess ? 3 : res.exitCode === 124 ? 5 : 6,
            description: isSuccess ? "Accepted" : res.exitCode === 124 ? "Time Limit Exceeded" : "Runtime Error",
          },
          time: `${res.durationMs}ms`,
          memory: 18400,
          exitCode: res.exitCode,
        };
      } catch {
        return this.fallbackSimulation(lang, sourceCode, stdin);
      } finally {
        await this.cleanupDir(dir);
      }
    }

    return this.fallbackSimulation(lang, sourceCode, stdin);
  }

  private fallbackSimulation(lang: string, _sourceCode: string, _stdin: string): Judge0Response {
    const errorMsg = `Compiler or runtime environment for "${lang}" is not available on this server host.`;
    return {
      stdout: "",
      stderr: errorMsg,
      compileOutput: errorMsg,
      message: "Execution environment unavailable",
      output: `[Execution Error]\n${errorMsg}`,
      status: { id: 11, description: "Runtime Error" },
      time: "0ms",
      memory: 0,
      exitCode: 1,
    };
  }
}

export const localRunnerService = new LocalRunnerService();
