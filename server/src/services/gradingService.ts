// src/services/gradingService.ts
import { judge0Service } from "./judge0Service.js";

export interface TestCaseItem {
  id?: string | undefined;
  input: string;
  expectedOutput: string;
  isHidden?: boolean | undefined;
  weight?: number | undefined;
  explanation?: string | undefined;
}

export interface GradingOptions {
  sourceCode: string;
  language: string;
  testCases: TestCaseItem[];
  timeLimit?: number | undefined;
  memoryLimit?: number | undefined;
  totalPoints?: number | undefined;
  isSubmission?: boolean | undefined;
}

export interface SingleTestResult {
  testCaseId: string;
  index: number;
  passed: boolean;
  actualOutput?: string | undefined;
  expectedOutput?: string | undefined;
  input?: string | undefined;
  error?: string | undefined;
  executionTime: number;
  memoryUsed: number;
  isHidden: boolean;
  weight: number;
  explanation?: string | undefined;
}

export interface GradingResult {
  score: number;
  testsPassed: number;
  totalTests: number;
  status: "PASSED" | "FAILED";
  testResults: SingleTestResult[];
  maxExecutionTime: number;
  maxMemoryUsed: number;
}

export class GradingService {
  private getExtension(lang: string): string {
    const map: Record<string, string> = {
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
    return map[lang.toLowerCase()] ?? "txt";
  }

  public async evaluateCode(options: GradingOptions): Promise<GradingResult> {
    const {
      sourceCode,
      language,
      testCases,
      timeLimit = 2.0,
      memoryLimit = 128000,
      totalPoints = 100,
      isSubmission = false,
    } = options;

    const ext = this.getExtension(language);
    const fileName = `solution.${ext}`;
    const testResults: SingleTestResult[] = [];

    let passedWeight = 0;
    let totalWeight = 0;
    let testsPassedCount = 0;
    let maxTime = 0;
    let maxMemory = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      if (!tc) continue;

      const tcWeight = typeof tc.weight === "number" && tc.weight > 0 ? tc.weight : 1;
      totalWeight += tcWeight;

      const tcId = tc.id ?? `tc_${i + 1}`;

      try {
        const execRes = await judge0Service.executeCode({
          engine: language,
          selectedFilePath: fileName,
          files: [{ name: fileName, path: fileName, content: sourceCode }],
          stdin: tc.input || "",
          expectedOutput: tc.expectedOutput || "",
          cpuTimeLimit: timeLimit,
          memoryLimitKb: memoryLimit,
        });

        const rawStdout = execRes.stdout || "";
        const rawExpected = tc.expectedOutput || "";

        // Standard clean string comparison (trim trailing whitespace and unify newlines)
        const cleanActual = rawStdout.trimEnd().replace(/\r\n/g, "\n");
        const cleanExpected = rawExpected.trimEnd().replace(/\r\n/g, "\n");

        const isAccepted = execRes.status?.id === 3;
        const outputsMatch = cleanActual === cleanExpected;
        const hasNoErrors = !execRes.stderr && !execRes.compileOutput;

        const passed = (isAccepted || outputsMatch) && hasNoErrors;

        if (passed) {
          passedWeight += tcWeight;
          testsPassedCount++;
        }

        const runTime = parseFloat(execRes.time || "0") || 0;
        const memUsed = execRes.memory || 0;
        if (runTime > maxTime) maxTime = runTime;
        if (memUsed > maxMemory) maxMemory = memUsed;

        // If this is a student evaluating public test or submission response, mask hidden details
        const shouldMask = tc.isHidden && !isSubmission;

        const errorMsg = execRes.stderr || execRes.compileOutput || (execRes.status?.id !== 3 ? execRes.status?.description : undefined);

        testResults.push({
          testCaseId: tcId,
          index: i + 1,
          passed,
          input: shouldMask ? "(Hidden Input)" : tc.input,
          expectedOutput: shouldMask ? "(Hidden Expected Output)" : tc.expectedOutput,
          actualOutput: shouldMask ? (passed ? "(Passed)" : "(Hidden Output)") : cleanActual,
          ...(errorMsg !== undefined ? { error: errorMsg } : {}),
          executionTime: runTime,
          memoryUsed: memUsed,
          isHidden: !!tc.isHidden,
          weight: tcWeight,
          ...(tc.explanation !== undefined ? { explanation: tc.explanation } : {}),
        });
      } catch (err: any) {
        testResults.push({
          testCaseId: tcId,
          index: i + 1,
          passed: false,
          input: tc.isHidden ? "(Hidden Input)" : tc.input,
          expectedOutput: tc.isHidden ? "(Hidden Output)" : tc.expectedOutput,
          actualOutput: "Execution Error",
          error: String(err?.message ?? "Execution failed in sandbox"),
          executionTime: 0,
          memoryUsed: 0,
          isHidden: !!tc.isHidden,
          weight: tcWeight,
          ...(tc.explanation !== undefined ? { explanation: tc.explanation } : {}),
        });
      }
    }

    const calculatedScore = totalWeight > 0
      ? Math.round((passedWeight / totalWeight) * totalPoints * 100) / 100
      : 0;

    return {
      score: calculatedScore,
      testsPassed: testsPassedCount,
      totalTests: testCases.length,
      status: testsPassedCount === testCases.length ? "PASSED" : "FAILED",
      testResults,
      maxExecutionTime: maxTime,
      maxMemoryUsed: maxMemory,
    };
  }
}

export const gradingService = new GradingService();
