import { jest } from "@jest/globals";
import { gradingService, type TestCaseItem } from "../services/gradingService.js";
import { judge0Service } from "../services/judge0Service.js";

describe("GradingService Unit Tests", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should calculate 100% score when all test cases pass", async () => {
    jest.spyOn(judge0Service, "executeCode").mockResolvedValue({
      stdout: "Hello World\n",
      stderr: "",
      compileOutput: "",
      message: "",
      output: "Hello World\n",
      status: { id: 3, description: "Accepted" },
      time: "45ms",
      memory: 12000,
      exitCode: 0,
    });

    const testCases: TestCaseItem[] = [
      { id: "tc1", input: "", expectedOutput: "Hello World", isHidden: false, weight: 1 },
      { id: "tc2", input: "", expectedOutput: "Hello World\r\n", isHidden: false, weight: 1 },
    ];

    const result = await gradingService.evaluateCode({
      sourceCode: 'print("Hello World")',
      language: "python",
      testCases,
      totalPoints: 100,
    });

    expect(result.status).toBe("PASSED");
    expect(result.score).toBe(100);
    expect(result.testsPassed).toBe(2);
    expect(result.totalTests).toBe(2);
    expect(result.testResults).toHaveLength(2);
    expect(result.testResults[0]?.passed).toBe(true);
    expect(result.testResults[1]?.passed).toBe(true);
  });

  it("should calculate weighted partial score correctly", async () => {
    jest.spyOn(judge0Service, "executeCode")
      .mockResolvedValueOnce({
        stdout: "10\n",
        stderr: "",
        compileOutput: "",
        message: "",
        output: "10\n",
        status: { id: 3, description: "Accepted" },
        time: "30ms",
        memory: 10000,
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: "Wrong Output\n",
        stderr: "",
        compileOutput: "",
        message: "",
        output: "Wrong Output\n",
        status: { id: 4, description: "Wrong Answer" },
        time: "35ms",
        memory: 10500,
        exitCode: 0,
      });

    const testCases: TestCaseItem[] = [
      { id: "tc1", input: "5 5", expectedOutput: "10", isHidden: false, weight: 3 },
      { id: "tc2", input: "2 3", expectedOutput: "5", isHidden: false, weight: 1 },
    ];

    const result = await gradingService.evaluateCode({
      sourceCode: "mock code",
      language: "python",
      testCases,
      totalPoints: 100,
    });

    expect(result.status).toBe("FAILED");
    expect(result.testsPassed).toBe(1);
    expect(result.totalTests).toBe(2);
    // Weight 3 out of 4 passed = 75 points
    expect(result.score).toBe(75);
    expect(result.testResults[0]?.passed).toBe(true);
    expect(result.testResults[1]?.passed).toBe(false);
  });

  it("should mask hidden test case details when not in submission review mode", async () => {
    jest.spyOn(judge0Service, "executeCode").mockResolvedValue({
      stdout: "SuperSecretOutput\n",
      stderr: "",
      compileOutput: "",
      message: "",
      output: "SuperSecretOutput\n",
      status: { id: 3, description: "Accepted" },
      time: "20ms",
      memory: 9000,
      exitCode: 0,
    });

    const testCases: TestCaseItem[] = [
      { id: "tc_hidden", input: "classified_input", expectedOutput: "SuperSecretOutput", isHidden: true },
    ];

    const result = await gradingService.evaluateCode({
      sourceCode: "mock code",
      language: "python",
      testCases,
      isSubmission: false, // Student testing public run
    });

    const hiddenResult = result.testResults[0];
    expect(hiddenResult?.isHidden).toBe(true);
    expect(hiddenResult?.input).toBe("(Hidden Input)");
    expect(hiddenResult?.expectedOutput).toBe("(Hidden Expected Output)");
    expect(hiddenResult?.actualOutput).toBe("(Passed)");
  });

  it("should reveal hidden test case details when in submission review mode", async () => {
    jest.spyOn(judge0Service, "executeCode").mockResolvedValue({
      stdout: "Secret\n",
      stderr: "",
      compileOutput: "",
      message: "",
      output: "Secret\n",
      status: { id: 3, description: "Accepted" },
      time: "20ms",
      memory: 9000,
      exitCode: 0,
    });

    const testCases: TestCaseItem[] = [
      { id: "tc_hidden", input: "secret_in", expectedOutput: "Secret", isHidden: true },
    ];

    const result = await gradingService.evaluateCode({
      sourceCode: "mock code",
      language: "python",
      testCases,
      isSubmission: true, // Official grading/submission evaluation
    });

    const hiddenResult = result.testResults[0];
    expect(hiddenResult?.isHidden).toBe(true);
    expect(hiddenResult?.input).toBe("secret_in");
    expect(hiddenResult?.expectedOutput).toBe("Secret");
  });

  it("should handle execution errors gracefully and record failure without crashing", async () => {
    jest.spyOn(judge0Service, "executeCode").mockRejectedValue(new Error("Connection timeout"));

    const testCases: TestCaseItem[] = [
      { id: "tc_fail", input: "test", expectedOutput: "test", isHidden: false },
    ];

    const result = await gradingService.evaluateCode({
      sourceCode: "broken code",
      language: "python",
      testCases,
      totalPoints: 50,
    });

    expect(result.status).toBe("FAILED");
    expect(result.score).toBe(0);
    expect(result.testsPassed).toBe(0);
    expect(result.testResults[0]?.passed).toBe(false);
    expect(result.testResults[0]?.error).toContain("Connection timeout");
  });

  it("should return score 0 when testCases array is empty", async () => {
    const result = await gradingService.evaluateCode({
      sourceCode: "empty",
      language: "python",
      testCases: [],
      totalPoints: 100,
    });

    expect(result.score).toBe(0);
    expect(result.totalTests).toBe(0);
    expect(result.testsPassed).toBe(0);
    expect(result.status).toBe("PASSED");
  });
});
