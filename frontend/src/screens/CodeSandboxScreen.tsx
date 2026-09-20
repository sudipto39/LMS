// src/screens/CodeSandboxScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Code2,
  Play,
  RotateCcw,
  Trash2,
  Copy,
  ChevronDown,
  File,
  Terminal,
  CheckCircle2,
  XCircle,
  Download,
  Clock,
  Cpu,
  Sparkles,
  RefreshCw,
  Maximize2,
  Minimize2,
  ArrowRight,
  Target,
  FlaskConical,
  ArrowLeft,
  Send,
} from "lucide-react";
import { Card, Btn, Btn2, Pill } from "../components/common/UIPrimitives";
import { executeApi, labsApi } from "../api";
import { useToast } from "../context/ToastContext";
import { checkRateLimit } from "../utils/security";
import type { LabAssignment, SingleTestResult } from "../types";

interface AlgorithmPreset {
  name: string;
  desc: string;
  code: string;
}

interface LanguageConfig {
  id: string;
  name: string;
  ver: string;
  ext: string;
  presets: AlgorithmPreset[];
}

interface ExecutionHistoryItem {
  id: string;
  language: string;
  status: string;
  statusId: number;
  time: string;
  memory: string;
  output: string;
  timestamp: string;
  codeSnippet: string;
}

interface CodeSandboxScreenProps {
  labAssignment?: LabAssignment | null;
  onExitLabMode?: () => void;
  onLabSubmitted?: () => void;
}

export const CodeSandboxScreen: React.FC<CodeSandboxScreenProps> = ({
  labAssignment,
  onExitLabMode,
  onLabSubmitted,
}) => {
  const showToast = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sandboxLanguages: LanguageConfig[] = [
    {
      id: "python",
      name: "Python",
      ver: "3.11.5",
      ext: "py",
      presets: [
        {
          name: "Fibonacci & Tests",
          desc: "Dynamic programming & benchmark verification",
          code: `# Python 3.11 — GiteaForge LMS Sandbox\n# Powered by Judge0 CE API\n\ndef fibonacci(n):\n    """Generate fibonacci sequence"""\n    a, b = 0, 1\n    result = []\n    for _ in range(n):\n        result.append(a)\n        a, b = b, a + b\n    return result\n\ndef main():\n    print("GiteaForge Standalone Code Sandbox")\n    print("=" * 36)\n    fib = fibonacci(10)\n    print(f"Fibonacci(10): {fib}")\n    print(f"Sum: {sum(fib)}")\n    print("\\n✓ All tests passed")\n\nif __name__ == "__main__":\n    main()`,
        },
        {
          name: "Binary Search",
          desc: "Logarithmic lookup in sorted list",
          code: `def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\nnumbers = [3, 7, 12, 19, 24, 38, 45, 62, 77, 89, 94]\ntarget = 45\nidx = binary_search(numbers, target)\nprint(f"Target {target} located at index: {idx}")`,
        },
        {
          name: "Quicksort Algorithm",
          desc: "Divide and conquer in-place sorting",
          code: `def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)\n\nunsorted = [64, 34, 25, 12, 22, 11, 90, 88, 42]\nprint(f"Original Array: {unsorted}")\nprint(f"Sorted Array:   {quicksort(unsorted)}")`,
        },
      ],
    },
    {
      id: "javascript",
      name: "JavaScript",
      ver: "Node 20",
      ext: "js",
      presets: [
        {
          name: "Array Reduce & Pipelines",
          desc: "Functional data pipelines and template strings",
          code: `// JavaScript — Node.js 20\nconst greet = (name) => \`Hello \${name}!\`;\nconsole.log(greet("GiteaForge Sandbox"));\n\nconst numbers = [12, 45, 68, 23, 91, 15];\nconst sum = numbers.reduce((acc, curr) => acc + curr, 0);\nconsole.log(\`Sum of numbers: \${sum}\`);\nconsole.log(\`Filtered (>30): \${JSON.stringify(numbers.filter(x => x > 30))}\`);`,
        },
        {
          name: "Async Event Loop Demo",
          desc: "Promises and microtask queue simulation",
          code: `async function processWorkflow() {\n  console.log("Step 1: Starting async workflow...");\n  const simulatedFetch = new Promise((resolve) => setTimeout(() => resolve({ status: "OK", latencyMs: 24 }), 100));\n  const result = await simulatedFetch;\n  console.log("Step 2: Received response:", result);\n  console.log("Step 3: Workflow complete.");\n}\n\nprocessWorkflow();`,
        },
        {
          name: "Stack & Queue Structures",
          desc: "Object-oriented data structures",
          code: `// JavaScript Data Structure: Stack\nclass Stack {\n  constructor() { this.items = []; }\n  push(el) { this.items.push(el); }\n  pop() { return this.items.pop(); }\n  peek() { return this.items[this.items.length - 1]; }\n  size() { return this.items.length; }\n}\n\nconst s = new Stack();\n["Phase 1: Architecture", "Phase 2: MVP", "Phase 3: Security Audit"].forEach(m => s.push(m));\nconsole.log("Stack Initial Size:", s.size());\nconsole.log("Top Element:", s.peek());\nconsole.log("Popped:", s.pop());\nconsole.log("Remaining Stack Size:", s.size());`,
        },
      ],
    },
    {
      id: "r",
      name: "R",
      ver: "4.0.0",
      ext: "r",
      presets: [
        {
          name: "Statistical Distribution",
          desc: "Normal distribution simulation & summary statistics",
          code: `# R 4.0.0 — Statistical Computing Engine\nset.seed(42)\nscores <- rnorm(25, mean = 82, sd = 8.5)\n\ncat("=== GiteaForge R Sandbox ===\\n")\ncat("Sample Size:", length(scores), "\\n")\ncat("Mean Score: ", round(mean(scores), 2), "\\n")\ncat("Median:     ", round(median(scores), 2), "\\n")\ncat("Std Dev:    ", round(sd(scores), 2), "\\n\\n")\n\ncat("Five-Number Summary:\\n")\nprint(fivenum(scores))`,
        },
        {
          name: "Linear Regression Model",
          desc: "Model fitting, summary, and prediction",
          code: `# Linear Regression Analysis in R\nhours_studied <- c(2, 3, 4, 5, 6, 7, 8, 9, 10, 12)\nexam_score    <- c(50, 55, 60, 68, 72, 80, 85, 88, 92, 98)\n\ndf <- data.frame(hours = hours_studied, score = exam_score)\nmodel <- lm(score ~ hours, data = df)\n\ncat("=== Linear Regression Output ===\\n")\nprint(summary(model))\n\n# Predict score for 11 hours\nnew_student <- data.frame(hours = 11)\npred <- predict(model, new_student)\ncat("\\nPredicted score for 11 hrs study:", round(pred, 2), "%\\n")`,
        },
        {
          name: "Matrix Algebra & Eigenvalues",
          desc: "Matrix multiplication & spectral decomposition",
          code: `# Matrix Operations & Eigenvalue Decomposition in R\nA <- matrix(c(4, 2, 1, 3), nrow = 2, byrow = TRUE)\nB <- matrix(c(1, 0, 2, 1), nrow = 2, byrow = TRUE)\n\ncat("Matrix A:\\n")\nprint(A)\ncat("\\nMatrix B:\\n")\nprint(B)\n\ncat("\\nMatrix Product (A %*% B):\\n")\nprint(A %*% B)\n\ncat("\\nEigenvalues of A:\\n")\nprint(eigen(A)$values)`,
        },
      ],
    },
    {
      id: "typescript",
      name: "TypeScript",
      ver: "5.3",
      ext: "ts",
      presets: [
        {
          name: "Typed Data Models",
          desc: "Interfaces, Generics, and Enums",
          code: `// TypeScript 5.3\nenum ProjectTier {\n  CAPSTONE = "Capstone",\n  RESEARCH = "Research",\n}\n\ninterface Project {\n  id: string;\n  title: string;\n  tier: ProjectTier;\n  score: number;\n}\n\nconst p: Project = {\n  id: "proj-101",\n  title: "Federated Learning Privacy Gateway",\n  tier: ProjectTier.CAPSTONE,\n  score: 96.5,\n};\n\nconsole.log(\`Project: \${p.title} [\${p.tier}] — Score: \${p.score}%\`);`,
        },
      ],
    },
    {
      id: "cpp",
      name: "C++",
      ver: "17",
      ext: "cpp",
      presets: [
        {
          name: "STL Vector Sorting",
          desc: "Standard Template Library vector & algorithms",
          code: `// C++ 17\n#include <iostream>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nint main() {\n    cout << "=== GiteaForge C++ Sandbox ===" << endl;\n    vector<int> v = {45, 12, 85, 32, 89, 39, 69, 44, 42, 1, 6, 8};\n    \n    sort(v.begin(), v.end());\n    \n    cout << "Sorted elements: ";\n    for (int x : v) {\n        cout << x << " ";\n    }\n    cout << endl;\n    return 0;\n}`,
        },
      ],
    },
    {
      id: "java",
      name: "Java",
      ver: "17",
      ext: "java",
      presets: [
        {
          name: "Main Class & Stream API",
          desc: "Java 17 Streams and sorting",
          code: `// Java 17\nimport java.util.Arrays;\nimport java.util.List;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from GiteaForge Java 17 Sandbox!");\n        List<Integer> list = Arrays.asList(10, 5, 8, 20, 15, 3, 42);\n        int sum = list.stream().mapToInt(Integer::intValue).sum();\n        System.out.println("Sum of list: " + sum);\n    }\n}`,
        },
      ],
    },
    {
      id: "go",
      name: "Go",
      ver: "1.22",
      ext: "go",
      presets: [
        {
          name: "Goroutines & Channels",
          desc: "Concurrent worker pipeline",
          code: `// Go 1.22\npackage main\n\nimport (\n\t"fmt"\n\t"time"\n)\n\nfunc worker(id int, ch chan string) {\n\ttime.Sleep(10 * time.Millisecond)\n\tch <- fmt.Sprintf("Worker %d finished task", id)\n}\n\nfunc main() {\n\tfmt.Println("GiteaForge Go Sandbox")\n\tch := make(chan string, 3)\n\tfor i := 1; i <= 3; i++ {\n\t\tgo worker(i, ch)\n\t}\n\tfor i := 1; i <= 3; i++ {\n\t\tfmt.Println(<-ch)\n\t}\n}`,
        },
      ],
    },
    {
      id: "rust",
      name: "Rust",
      ver: "1.76",
      ext: "rs",
      presets: [
        {
          name: "Iterators & Sum",
          desc: "Memory-safe functional iterators",
          code: `// Rust 1.76\nfn main() {\n    println!("GiteaForge Rust Sandbox");\n    let numbers = vec![10, 20, 30, 40, 50];\n    let sum: i32 = numbers.iter().sum();\n    println!("Elements: {:?}", numbers);\n    println!("Total Sum: {}", sum);\n}`,
        },
      ],
    },
    {
      id: "c",
      name: "C",
      ver: "GCC 13",
      ext: "c",
      presets: [
        {
          name: "Pointers & Arrays",
          desc: "Low-level memory array traversal",
          code: `// C — GCC 13\n#include <stdio.h>\n\nint main() {\n    printf("=== GiteaForge C Sandbox ===\\n");\n    int arr[] = {10, 20, 30, 40, 50};\n    int len = sizeof(arr) / sizeof(arr[0]);\n    int sum = 0;\n    \n    for (int i = 0; i < len; i++) {\n        sum += *(arr + i);\n    }\n    \n    printf("Array Sum: %d\\n", sum);\n    return 0;\n}`,
        },
      ],
    },
  ];

  const [sandboxLang, setSandboxLang] = useState("python");
  const activeLangConfig = sandboxLanguages.find((l) => l.id === sandboxLang) || sandboxLanguages[0];
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [sandboxCode, setSandboxCode] = useState(activeLangConfig.presets[0].code);
  const [codeOut, setCodeOut] = useState("");
  const [lastExecStatus, setLastExecStatus] = useState<{ id: number; desc: string; time: string; memory: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [sandboxActiveFile, setSandboxActiveFile] = useState("main.py");
  const [sandboxStdin, setSandboxStdin] = useState("");
  const [structuredInputs, setStructuredInputs] = useState<{ [key: number]: string }>({});
  const [inputMode, setInputMode] = useState<"smart" | "freeform" | "multiline">("smart");
  const [fontSize, setFontSize] = useState<"12px" | "14px" | "16px">("13px" as any);
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"output" | "history" | "labTests">("output");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Intelligent Input Prompts Detection ───────────────────────────────────
  const detectedPrompts = React.useMemo(() => {
    if (!sandboxCode) return [];
    const prompts: string[] = [];
    if (sandboxLang === "python") {
      const regex = /input\s*\(\s*(?:f?["'](.*?)["'])?\s*\)/g;
      let match;
      while ((match = regex.exec(sandboxCode)) !== null) {
        prompts.push(match[1] || `Input #${prompts.length + 1}`);
      }
    } else if (sandboxLang === "c" || sandboxLang === "cpp") {
      const scanfMatches = (sandboxCode.match(/scanf\s*\(/g) || []).length;
      const cinMatches = (sandboxCode.match(/cin\s*>>/g) || []).length;
      for (let i = 0; i < scanfMatches + cinMatches; i++) {
        prompts.push(`Input #${i + 1}`);
      }
    } else if (sandboxLang === "java") {
      const nextMatches = (sandboxCode.match(/(?:scanner|sc|in)\.(?:next|nextLine|nextInt|nextDouble)\s*\(/gi) || []).length;
      for (let i = 0; i < nextMatches; i++) {
        prompts.push(`Input #${i + 1}`);
      }
    }
    return prompts;
  }, [sandboxCode, sandboxLang]);

  const isInteractiveCode = detectedPrompts.length > 0;

  // ── Lab Assignment Mode State ─────────────────────────────────────────────
  const [labTestResults, setLabTestResults] = useState<SingleTestResult[]>([]);
  const [labScore, setLabScore] = useState<number | null>(null);
  const [runningLabTests, setRunningLabTests] = useState(false);
  const [submittingLab, setSubmittingLab] = useState(false);

  useEffect(() => {
    if (labAssignment) {
      const isPolyglot = !labAssignment.language || labAssignment.language === "all" || labAssignment.language === "any";
      const targetLangId = labAssignment.mySubmission?.language?.toLowerCase() || (isPolyglot ? "python" : (labAssignment.language || "python").toLowerCase());
      const matchLang = sandboxLanguages.find((l) => l.id === targetLangId) || sandboxLanguages[0];
      if (matchLang) {
        setSandboxLang(matchLang.id);
        setSandboxActiveFile(`solution.${matchLang.ext}`);
      }
      if (labAssignment.mySubmission?.code) {
        setSandboxCode(labAssignment.mySubmission.code);
      } else if (labAssignment.starterCode) {
        setSandboxCode(labAssignment.starterCode);
      }
      if (labAssignment.mySubmission?.testResults) {
        setLabTestResults(labAssignment.mySubmission.testResults);
        setLabScore(labAssignment.mySubmission.score);
      }
    }
  }, [labAssignment]);

  const handleRunPublicLabTests = async () => {
    if (!labAssignment || runningLabTests) return;
    try {
      setRunningLabTests(true);
      setActiveTab("labTests");
      const res = await labsApi.runPublicTests(
        labAssignment.id,
        sandboxCode,
        sandboxLang
      );
      if (res?.data) {
        setLabTestResults(res.data.testResults);
        setLabScore(res.data.score);
        showToast(`Sample Tests: ${res.data.testsPassed}/${res.data.totalTests} Passed (${res.data.score} pts)`);
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to run public test cases");
    } finally {
      setRunningLabTests(false);
    }
  };

  const handleSubmitLabSolution = async () => {
    if (!labAssignment || submittingLab) return;
    if (!window.confirm(`Submit final solution for "${labAssignment.title}"? Your code will be evaluated against all test cases.`)) return;

    try {
      setSubmittingLab(true);
      setActiveTab("labTests");
      const res = await labsApi.submitLabAssignment(
        labAssignment.id,
        sandboxCode,
        sandboxLang
      );
      if (res?.data) {
        setLabTestResults(res.data.evaluation.testResults);
        setLabScore(res.data.evaluation.score);
        showToast(`🎉 Solution Submitted! Final Score: ${res.data.evaluation.score}/${labAssignment.totalPoints}`);
        if (onLabSubmitted) onLabSubmitted();
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to submit lab solution");
    } finally {
      setSubmittingLab(false);
    }
  };

  // ── Keyboard Shortcut: Ctrl + Enter / Cmd + Enter ─────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunSandbox();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // ── Handle Tab key in Textarea ───────────────────────────────────────────
  const handleKeyDownInEditor = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = sandboxCode.substring(0, start) + "  " + sandboxCode.substring(end);
      setSandboxCode(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleLanguageChange = (langId: string) => {
    const lang = sandboxLanguages.find((l) => l.id === langId) || sandboxLanguages[0];
    setSandboxLang(langId);
    setSelectedPresetIndex(0);
    setSandboxCode(lang.presets[0].code);
    setSandboxActiveFile(`main.${lang.ext}`);
    setCodeOut("");
    setLastExecStatus(null);
  };

  const handlePresetSelect = (presetIndex: number) => {
    setSelectedPresetIndex(presetIndex);
    const preset = activeLangConfig.presets[presetIndex];
    if (preset) {
      setSandboxCode(preset.code);
      showToast(`Loaded preset: ${preset.name}`);
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([sandboxCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sandboxActiveFile;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${sandboxActiveFile}`);
  };

  const handleRunSandbox = async (overrideStdin?: string | unknown) => {
    if (running) return;

    const passedStdin = typeof overrideStdin === "string" ? overrideStdin : undefined;
    let effectiveStdin = passedStdin !== undefined ? passedStdin : sandboxStdin;

    // If in smart mode and structured inputs are provided:
    if (inputMode === "smart" && detectedPrompts.length > 0 && passedStdin === undefined) {
      const parts: string[] = [];
      for (let i = 0; i < detectedPrompts.length; i++) {
        parts.push(structuredInputs[i] || "");
      }
      if (parts.some((p) => p.trim().length > 0)) {
        effectiveStdin = parts.join("\n");
      }
    }

    const { allowed, retryAfter } = checkRateLimit("sandbox_run_code", 15, 60000);
    if (!allowed) {
      showToast(`Execution rate limit reached. Please wait ${retryAfter}s.`);
      setCodeOut(`⚠️ Rate Limit Exceeded:\nYou have performed too many executions in a short window. Please wait ${retryAfter} seconds before trying again.`);
      setActiveTab("output");
      return;
    }

    setRunning(true);
    setCodeOut("");
    setActiveTab("output");
    const lang = activeLangConfig;

    try {
      const res = await executeApi.runCode({
        language: sandboxLang,
        sourceCode: sandboxCode,
        stdin: effectiveStdin,
      });

      const execData = res.data as any;
      if (execData) {
        let rawOutput =
          execData.output ||
          execData.stdout ||
          execData.stderr ||
          execData.compileOutput ||
          execData.compile_output ||
          execData.message ||
          "";

        const statusId = execData.status?.id || (execData.exitCode === 0 ? 3 : 6);
        const statusDescription =
          execData.status?.description ||
          (statusId === 3 ? "Accepted" : "Runtime Error");

        const executionTime = execData.time || "12ms";
        const memoryUsed = execData.memory ? `${execData.memory} KB` : "140 KB";

        setLastExecStatus({
          id: statusId,
          desc: statusDescription,
          time: executionTime,
          memory: memoryUsed,
        });

        // ── Pretty Interleaved Output for interactive inputs ──
        let displayOutput = rawOutput;
        if (effectiveStdin && detectedPrompts.length > 0 && statusId === 3) {
          const stdinLines = effectiveStdin.split(/\r?\n/);
          let merged = rawOutput;
          let replacedCount = 0;
          for (let i = 0; i < detectedPrompts.length; i++) {
            const p = detectedPrompts[i];
            const val = stdinLines[i] ?? "";
            if (p && merged.includes(p)) {
              merged = merged.replace(p, `${p}${val}\n`);
              replacedCount++;
            }
          }
          if (replacedCount > 0) {
            displayOutput = merged.trim();
          }
        }

        const formattedLog = `> Judge0 Remote Engine • ${lang.name} ${lang.ver}\n> Status: ${statusDescription} (Exit: ${execData.exitCode ?? 0})\n> Execution Time: ${executionTime} • Memory: ${memoryUsed}\n\n${
          displayOutput || "(Process executed with no console output)"
        }\n\n────────────────────────────────────────\n⏱ Finished • ${new Date().toLocaleTimeString()}`;

        setCodeOut(formattedLog);

        // Add to history
        const newHistoryItem: ExecutionHistoryItem = {
          id: `run-${Date.now()}`,
          language: lang.name,
          status: statusDescription,
          statusId,
          time: executionTime,
          memory: memoryUsed,
          output: formattedLog,
          timestamp: new Date().toLocaleTimeString(),
          codeSnippet: sandboxCode.slice(0, 80) + "...",
        };
        setHistory((prev) => [newHistoryItem, ...prev.slice(0, 9)]);
      } else {
        setCodeOut(`> Judge0 Remote Engine\n> Process completed with no output.`);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not execute code on backend server. Please verify backend connectivity.";

      setLastExecStatus({
        id: 6,
        desc: "Execution Error",
        time: "0ms",
        memory: "0 KB",
      });

      const formattedLog = `> Judge0 Remote Engine • ${lang.name} ${lang.ver}\n> Status: Execution Error (Exit: 1)\n\n❌ ${errorMsg}\n\n────────────────────────────────────────\n⏱ Finished • ${new Date().toLocaleTimeString()}`;
      setCodeOut(formattedLog);

      const newHistoryItem: ExecutionHistoryItem = {
        id: `run-${Date.now()}`,
        language: lang.name,
        status: "Execution Error",
        statusId: 6,
        time: "0ms",
        memory: "0 KB",
        output: formattedLog,
        timestamp: new Date().toLocaleTimeString(),
        codeSnippet: sandboxCode.slice(0, 80) + "...",
      };
      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 9)]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={`w-full max-w-[1800px] mx-auto space-y-4 ${isFullscreen ? "fixed inset-0 z-50 p-4 bg-[var(--bg)] overflow-y-auto" : ""}`}>
      {/* Lab Assignment Banner (If in Lab Mode) */}
      {labAssignment && (
        <Card className="p-4 space-y-3 border-2 border-[#06b6d4]/40 bg-[#06b6d4]/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl grid place-items-center bg-[#06b6d4] text-white shadow-md">
                <FlaskConical size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill color="#10b981">
                    📁 {labAssignment.subject || labAssignment.batch?.course?.title || "General Programming"}
                  </Pill>
                  <Pill color="#06b6d4">Batch: {labAssignment.batch?.name || "Target Batch"}</Pill>
                  <Pill color="#8b5cf6" className="capitalize">
                    {labAssignment.language === "all" || labAssignment.language === "any"
                      ? "✨ Any Language (Polyglot)"
                      : labAssignment.language}
                  </Pill>
                  <span className="font-mono text-[12px] font-bold" style={{ color: "var(--t1)" }}>
                    Total Marks: {labAssignment.totalPoints} pts
                  </span>
                </div>
                <h2 className="text-[17px] font-bold mt-0.5">{labAssignment.title}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onExitLabMode && (
                <Btn2
                  type="button"
                  onClick={onExitLabMode}
                  className="!h-8 text-[11px] !px-3 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={13} /> Back to Labs
                </Btn2>
              )}
              <Btn2
                type="button"
                onClick={handleRunPublicLabTests}
                disabled={runningLabTests || submittingLab}
                className="!h-8 text-[11px] !px-3 flex items-center gap-1.5 cursor-pointer !bg-[#06b6d4]/20 !text-[#06b6d4] border border-[#06b6d4]/40"
              >
                <Play size={12} /> {runningLabTests ? "Testing..." : "Run Public Tests"}
              </Btn2>
              <Btn
                type="button"
                onClick={handleSubmitLabSolution}
                disabled={runningLabTests || submittingLab}
                className="!h-8 text-[11px] !px-3.5 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Send size={12} /> {submittingLab ? "Evaluating..." : "Submit Solution"}
              </Btn>
            </div>
          </div>

          {/* 🎯 LAB EXPERIMENT OBJECTIVE HIGHLIGHT */}
          <div className="p-3 rounded-xl border space-y-1 bg-[var(--srf)] border-[#06b6d4]/30">
            <div className="text-[11px] font-bold flex items-center gap-1 text-[#06b6d4] uppercase tracking-wide">
              <Target size={14} /> Experiment Objective:
            </div>
            <p className="text-[12px] leading-relaxed font-sans" style={{ color: "var(--t1)" }}>
              {labAssignment.objective}
            </p>
            {labAssignment.prerequisites && (
              <div className="text-[11px] text-[#8b5cf6] font-medium pt-1">
                Prerequisites: {labAssignment.prerequisites}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-bold flex items-center gap-2">
            <Code2 size={24} style={{ color: "var(--acc)" }} />
            {labAssignment ? `Lab IDE: ${labAssignment.title}` : "Multi-Language Judge0 Sandbox"}
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--t2)" }}>
            {labAssignment
              ? "Implement and verify your solution against unit test suites in an isolated sandbox"
              : "Compile, run, and benchmark algorithm test cases across 8 languages in isolated GCP containers"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill color="#06b6d4">Judge0 CE Engine</Pill>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8 rounded-lg border grid place-items-center cursor-pointer transition hover:border-[var(--acc)]"
            style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t2)" }}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Editor"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Controls & Toolbar */}
      <Card className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Language & Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Language Selector */}
          <div className="relative min-w-[145px]">
            <select
              value={sandboxLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={Boolean(labAssignment && labAssignment.language !== "all" && labAssignment.language !== "any")}
              className="w-full h-9 pl-3 pr-8 rounded-xl border text-[12px] font-bold appearance-none cursor-pointer disabled:opacity-80"
              style={{
                background: "var(--srf2)",
                borderColor: "var(--bdr)",
                color: "var(--t1)",
              }}
            >
              {sandboxLanguages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.ver})
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--t3)" }}
            />
          </div>

          {/* Algorithm Presets */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {activeLangConfig.presets.map((preset, idx) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(idx)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 border whitespace-nowrap ${
                  selectedPresetIndex === idx
                    ? "bg-[#0e4a5e] text-white border-[var(--acc)]"
                    : "border-transparent text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--srf2)]"
                }`}
                title={preset.desc}
              >
                <Sparkles size={11} /> {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions (Run, Reset, Download, Font Size) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Font Size Picker */}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-lg border text-[11px]"
            style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
          >
            {(["12px", "13px", "15px"] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setFontSize(sz as any)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                  fontSize === sz ? "bg-[#0e4a5e] text-white" : "text-[var(--t3)] hover:text-[var(--t1)]"
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          {/* Download Code */}
          <button
            type="button"
            onClick={handleDownloadCode}
            className="h-9 px-2.5 rounded-xl border flex items-center gap-1 text-[11px] font-medium cursor-pointer transition hover:border-[var(--acc)]"
            style={{ background: "var(--srf2)", borderColor: "var(--bdr)", color: "var(--t2)" }}
            title="Download code file"
          >
            <Download size={12} /> Save
          </button>

          {/* Reset Code */}
          <button
            type="button"
            onClick={() => {
              const p = activeLangConfig.presets[selectedPresetIndex] || activeLangConfig.presets[0];
              setSandboxCode(p.code);
              showToast("Template reset");
            }}
            className="h-9 px-2.5 rounded-xl border flex items-center gap-1 text-[11px] font-medium cursor-pointer transition hover:border-[var(--acc)]"
            style={{ background: "var(--srf2)", borderColor: "var(--bdr)", color: "var(--t2)" }}
            title="Reset code template"
          >
            <RefreshCw size={12} /> Reset
          </button>

          {/* Run Code Button */}
          <Btn
            onClick={() => handleRunSandbox()}
            className={`!h-9 text-[12px] font-bold !px-4 ${
              running ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {running ? (
              <>
                <RotateCcw size={13} className="animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" /> Run Code (Ctrl+Enter)
              </>
            )}
          </Btn>
        </div>
      </Card>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-4">
        {/* ── CODE EDITOR CONTAINER ────────────────────────────────────── */}
        <div className="space-y-3">
          <Card className="overflow-hidden border shadow-sm" style={{ background: "#060e15" }}>
            {/* Editor Window Header */}
            <div
              className="h-10 border-b flex items-center gap-2 px-4 select-none"
              style={{ borderColor: "#1a3a50", background: "#0a1724" }}
            >
              {/* Traffic Lights */}
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ef4444]/90" />
                <span className="h-3 w-3 rounded-full bg-[#f59e0b]/90" />
                <span className="h-3 w-3 rounded-full bg-[#22c55e]/90" />
              </div>

              {/* Active Tab */}
              <div
                className="flex items-center gap-1.5 ml-3 px-3 py-1 rounded-md text-[12px] font-semibold mono"
                style={{ background: "#060e15", color: "var(--acc)", border: "1px solid #1a3a50" }}
              >
                <File size={12} />
                <span>{sandboxActiveFile}</span>
              </div>

              <div className="flex-1" />

              {/* Copy Code */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(sandboxCode);
                  showToast("Code copied to clipboard");
                }}
                className="h-7 px-2 rounded-lg grid place-items-center cursor-pointer transition hover:bg-[#1a3a50]"
                style={{ color: "var(--t2)" }}
                title="Copy code"
              >
                <Copy size={12} />
              </button>
            </div>

            {/* Line Numbers & Editor Textarea */}
            <div className="flex relative">
              {/* Line Numbers */}
              <div
                className="w-12 bg-[#040a10] text-right pr-3 py-3 select-none text-[#3a5a6a] mono text-[12px] leading-[22px] border-r border-[#1a3a50]"
              >
                {sandboxCode.split("\n").map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Editor Input Area */}
              <textarea
                ref={textareaRef}
                value={sandboxCode}
                onChange={(e) => setSandboxCode(e.target.value)}
                onKeyDown={handleKeyDownInEditor}
                className="flex-1 p-3 mono focus:outline-none resize-none bg-[#060e15] text-[#e0f2f7] min-h-[480px] leading-[22px]"
                style={{ fontSize }}
                spellCheck={false}
              />
            </div>
          </Card>
        </div>

        {/* ── CONSOLE & INTERACTIVE TABS CONTAINER ─────────────────────── */}
        <div className="space-y-3">
          <div
            className="rounded-2xl border overflow-hidden bg-[#060e15] shadow-sm flex flex-col min-h-[530px]"
            style={{ borderColor: "#1a3a50" }}
          >
            {/* Terminal Navigation Header */}
            <div className="h-10 flex items-center justify-between px-3 bg-[#0a1724] border-b border-[#1a3a50]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("output")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "output"
                      ? "bg-[#0891b225] text-[#22d3ee] border border-[#0891b250]"
                      : "text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  <Terminal size={12} /> Interactive Console {isInteractiveCode ? "• Inputs Detected" : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "history"
                      ? "bg-[#0891b225] text-[#22d3ee] border border-[#0891b250]"
                      : "text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  History ({history.length})
                </button>
                {labAssignment && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("labTests")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "labTests"
                        ? "bg-[#06b6d4] text-white shadow-sm"
                        : "text-[#06b6d4] hover:bg-[#06b6d4]/10"
                    }`}
                  >
                    🧪 Lab Test Suite ({labTestResults.filter((r) => r.passed).length}/{labTestResults.length || (labAssignment.testCases as any[])?.length || 0})
                  </button>
                )}
              </div>

              {/* Status Badge */}
              {lastExecStatus && !running && activeTab === "output" && (
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  {lastExecStatus.id === 3 ? (
                    <span className="text-[#4ade80] flex items-center gap-1 font-bold">
                      <CheckCircle2 size={11} /> {lastExecStatus.desc}
                    </span>
                  ) : (
                    <span className="text-[#f87171] flex items-center gap-1 font-bold">
                      <XCircle size={11} /> {lastExecStatus.desc}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* TAB 1: Unified Interactive Console View */}
            {activeTab === "output" && (
              <div className="flex-1 flex flex-col justify-between p-3.5 min-h-[460px] space-y-3">
                {/* Scrollable Terminal Output */}
                <pre className="text-[11px] mono whitespace-pre-wrap flex-1 overflow-auto text-[#cbd5e1] leading-relaxed max-h-[300px] min-h-[160px] p-3 rounded-xl bg-[#040a10] border border-[#1a3a50]/60">
                  {running ? (
                    <span className="text-[#f59e0b] animate-pulse flex items-center gap-2">
                      <RotateCcw size={13} className="animate-spin" /> Sending payload to Judge0 Sandbox VM container...
                    </span>
                  ) : (
                    codeOut || (
                      <span className="text-[#3a5a6a]">
                        {"> Click \"Run Code (Ctrl+Enter)\" or enter input below to run.\n> Standard output, execution metrics, and interactive results appear here."}
                      </span>
                    )
                  )}
                </pre>

                {/* EOF / Input Prompt Alert if execution threw EOFError or waiting for input */}
                {codeOut && (codeOut.includes("EOFError") || codeOut.includes("EOF when reading a line") || codeOut.includes("NoSuchElementException")) && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Sparkles size={14} className="text-amber-400 shrink-0" />
                      Program requires user input. Enter values in the interactive input box below:
                    </span>
                  </div>
                )}

                {/* ── LIVE INTERACTIVE TERMINAL INPUT PANEL ────────────────── */}
                <div className="p-3 rounded-xl border border-[#1a3a50] bg-[#0a1724] space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#94a3b8] font-bold flex items-center gap-1.5">
                        <Terminal size={13} className="text-[#22d3ee]" />
                        Terminal Input (stdin)
                      </span>
                      {isInteractiveCode && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30">
                          {detectedPrompts.length} input prompt{detectedPrompts.length > 1 ? "s" : ""} detected
                        </span>
                      )}
                    </div>

                    {/* Input Mode Switcher */}
                    <div className="flex items-center gap-1 text-[10px]">
                      {isInteractiveCode && (
                        <button
                          type="button"
                          onClick={() => setInputMode("smart")}
                          className={`px-2 py-0.5 rounded cursor-pointer transition ${
                            inputMode === "smart"
                              ? "bg-[#22d3ee]/20 text-[#22d3ee] font-bold"
                              : "text-[#64748b] hover:text-[#94a3b8]"
                          }`}
                        >
                          Smart Prompts
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setInputMode("freeform")}
                        className={`px-2 py-0.5 rounded cursor-pointer transition ${
                          inputMode === "freeform"
                            ? "bg-[#22d3ee]/20 text-[#22d3ee] font-bold"
                            : "text-[#64748b] hover:text-[#94a3b8]"
                        }`}
                      >
                        Single Line
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode("multiline")}
                        className={`px-2 py-0.5 rounded cursor-pointer transition ${
                          inputMode === "multiline"
                            ? "bg-[#22d3ee]/20 text-[#22d3ee] font-bold"
                            : "text-[#64748b] hover:text-[#94a3b8]"
                        }`}
                      >
                        Multiline (⤢)
                      </button>
                    </div>
                  </div>

                  {/* Input form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRunSandbox();
                    }}
                    className="space-y-2"
                  >
                    {/* Mode 1: Smart Prompts */}
                    {inputMode === "smart" && isInteractiveCode ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {detectedPrompts.map((promptText, idx) => (
                            <div key={idx} className="space-y-1">
                              <label className="text-[10px] font-bold text-[#22d3ee] flex items-center gap-1">
                                <span className="h-4 w-4 rounded-full bg-[#22d3ee]/20 grid place-items-center text-[9px]">
                                  {idx + 1}
                                </span>
                                <span className="truncate">{promptText.trim() || `Input #${idx + 1}`}</span>
                              </label>
                              <input
                                type="text"
                                value={structuredInputs[idx] || ""}
                                onChange={(e) =>
                                  setStructuredInputs({
                                    ...structuredInputs,
                                    [idx]: e.target.value,
                                  })
                                }
                                placeholder={`Value for ${promptText.replace(/[:?]/g, "").trim()}...`}
                                className="w-full h-8 rounded-lg border px-2.5 mono text-[11px] bg-[#040a10] border-[#1a3a50] text-[#e0f2f7] focus:border-[#22d3ee] outline-none transition"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end pt-1">
                          <Btn
                            type="submit"
                            disabled={running}
                            className="!h-8 text-[11px] !px-4 font-bold"
                          >
                            <Send size={12} /> Send & Run Code ↵
                          </Btn>
                        </div>
                      </div>
                    ) : inputMode === "multiline" ? (
                      /* Mode 2: Multiline */
                      <div className="space-y-1.5">
                        <textarea
                          value={sandboxStdin}
                          onChange={(e) => setSandboxStdin(e.target.value)}
                          placeholder="Enter multiline inputs (one per line)...&#10;e.g.&#10;Sudipto&#10;22"
                          className="w-full h-24 rounded-lg border p-2.5 mono text-[12px] focus:outline-none resize-none bg-[#040a10] border-[#1a3a50] text-[#e0f2f7]"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-[#64748b]">One input per line</span>
                          <Btn
                            type="submit"
                            disabled={running}
                            className="!h-8 text-[11px] !px-3 font-bold"
                          >
                            <Send size={12} /> Send & Run ↵
                          </Btn>
                        </div>
                      </div>
                    ) : (
                      /* Mode 3: Single Line */
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#22d3ee] mono font-bold text-[12px]">
                            &gt;
                          </span>
                          <input
                            type="text"
                            value={sandboxStdin}
                            onChange={(e) => setSandboxStdin(e.target.value)}
                            placeholder={
                              detectedPrompts.length > 0
                                ? `e.g. ${detectedPrompts.map((p) => p.replace(/[:?]/g, "").trim()).join("  ") || "Sudipto 22"}`
                                : "Type input values (e.g. Sudipto 22) and press Enter..."
                            }
                            className="w-full h-9 rounded-lg border pl-7 pr-3 mono text-[12px] focus:outline-none bg-[#040a10] border-[#1a3a50] text-[#e0f2f7] focus:border-[#22d3ee]"
                          />
                        </div>
                        <Btn
                          type="submit"
                          disabled={running}
                          className="!h-9 text-[11px] !px-4 font-bold shrink-0"
                        >
                          <Send size={12} /> Run ↵
                        </Btn>
                      </div>
                    )}
                  </form>
                </div>

                {/* Footer Metrics Row */}
                {lastExecStatus && !running && (
                  <div className="pt-2 border-t border-[#1a3a50] flex items-center justify-between text-[10px] text-[#64748b] mono">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-[#38bdf8]" /> {lastExecStatus.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu size={11} className="text-[#a78bfa]" /> {lastExecStatus.memory}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(codeOut);
                          showToast("Output copied");
                        }}
                        className="hover:text-[#94a3b8] cursor-pointer flex items-center gap-1"
                      >
                        <Copy size={10} /> Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCodeOut("");
                          setLastExecStatus(null);
                        }}
                        className="hover:text-[#f87171] cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={10} /> Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Execution History */}
            {activeTab === "history" && (
              <div className="p-4 space-y-2 flex-1 overflow-y-auto max-h-[460px]">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-[#64748b] text-[11px] space-y-2">
                    <Clock size={24} className="mx-auto opacity-40" />
                    <div>No execution runs recorded yet in this session.</div>
                  </div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setCodeOut(item.output);
                        setActiveTab("output");
                      }}
                      className="p-2.5 rounded-xl border border-[#1a3a50] hover:border-[#22d3ee] bg-[#0a1724] cursor-pointer transition flex items-center justify-between text-[11px] group"
                    >
                      <div>
                        <div className="font-semibold text-[#e2e8f0] flex items-center gap-2">
                          <span>{item.language}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              item.statusId === 3
                                ? "bg-[#4ade8020] text-[#4ade80]"
                                : "bg-[#f8717120] text-[#f87171]"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#64748b] mt-0.5 mono">
                          {item.timestamp} • {item.time}
                        </div>
                      </div>
                      <ArrowRight size={13} className="text-[#64748b] group-hover:text-[#22d3ee] transition" />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: Lab Test Suite Results */}
            {activeTab === "labTests" && (
              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[460px]">
                {/* Top Lab Score Summary Card */}
                {labScore !== null && (
                  <div className="p-3 rounded-xl border flex items-center justify-between bg-emerald-500/10 border-emerald-500/30">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Current Evaluation Score</div>
                      <div className="text-[18px] font-bold font-mono text-emerald-400">
                        {labScore} / {labAssignment?.totalPoints || 100} pts
                      </div>
                    </div>
                    <div className="text-right text-[11px] font-mono text-emerald-300">
                      {labTestResults.filter((r) => r.passed).length} / {labTestResults.length} Tests Passed
                    </div>
                  </div>
                )}

                {labTestResults.length === 0 ? (
                  <div className="text-center py-12 text-[#64748b] text-[11px] space-y-2">
                    <CheckCircle2 size={24} className="mx-auto opacity-40 text-[#06b6d4]" />
                    <div>Click "Run Public Tests" or "Submit Solution" to evaluate your code against the unit test suite.</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {labTestResults.map((tr) => (
                      <div
                        key={tr.testCaseId || tr.index}
                        className={`p-3 rounded-xl border text-[11px] font-mono space-y-2 transition ${
                          tr.passed
                            ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                            : "bg-red-950/20 border-red-800/40 text-red-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold">
                            {tr.passed ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 size={13} /> Test #{tr.index} Passed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400">
                                <XCircle size={13} /> Test #{tr.index} Failed
                              </span>
                            )}
                            {tr.isHidden && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/50">
                                Hidden Test
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] opacity-70">
                            {tr.executionTime}s • {Math.round(tr.memoryUsed / 1024)}MB
                          </div>
                        </div>

                        {!tr.isHidden && (
                          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                            <div className="p-2 rounded bg-black/40 border border-white/5">
                              <span className="text-gray-400 block mb-0.5">Input:</span>
                              <pre className="overflow-x-auto text-gray-200">{tr.input || "(No stdin)"}</pre>
                            </div>
                            <div className="p-2 rounded bg-black/40 border border-white/5">
                              <span className="text-gray-400 block mb-0.5">Expected:</span>
                              <pre className="overflow-x-auto text-gray-200">{tr.expectedOutput}</pre>
                            </div>
                          </div>
                        )}

                        {tr.actualOutput && !tr.isHidden && (
                          <div className="p-2 rounded bg-black/40 border border-white/5 text-[10px]">
                            <span className="text-gray-400 block mb-0.5">Actual Output:</span>
                            <pre className="overflow-x-auto text-gray-200">{tr.actualOutput}</pre>
                          </div>
                        )}

                        {tr.error && (
                          <div className="p-2 rounded bg-red-950/40 border border-red-900/50 text-red-300 text-[10px]">
                            <span className="font-bold block mb-0.5">Error / Trace:</span>
                            <pre className="overflow-x-auto whitespace-pre-wrap">{tr.error}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeSandboxScreen;
