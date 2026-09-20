// src/components/modals/CreateLabAssignmentModal.tsx
import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Target,
  FileCode,
  CheckCircle2,
  Sliders,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Cpu,
  Sparkles,
  Folder,
  Upload,
  FileText,
} from "lucide-react";
import { Card, Inp, Btn, Btn2, Pill } from "../common/UIPrimitives";
import { labsApi, batchesApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import type { Batch, LabAssignment, TestCase } from "../../types";

interface CreateLabAssignmentModalProps {
  show: boolean;
  onClose: () => void;
  batches: Batch[];
  initialSubject?: string;
  onAssignmentCreated: (newAssignment: LabAssignment) => void;
}

export const CreateLabAssignmentModal: React.FC<CreateLabAssignmentModalProps> = ({
  show,
  onClose,
  batches,
  initialSubject,
  onAssignmentCreated,
}) => {
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState<"details" | "code" | "tests" | "limits">("details");
  const [submitting, setSubmitting] = useState(false);

  const [liveBatches, setLiveBatches] = useState<Batch[]>(batches || []);

  const PRESET_SUBJECTS = [
    "Data Structures & Algorithms",
    "Operating Systems",
    "Database Management Systems (DBMS)",
    "Computer Networks",
    "Object-Oriented Programming (OOP)",
    "Machine Learning & Artificial Intelligence",
    "Web Technologies & Full-Stack Development",
    "Cyber Security & Cryptography",
    "Compiler Design & Automata",
    "Software Engineering & Architecture",
    "Computer Architecture & Microprocessors",
    "Cloud Computing & Distributed Systems",
    "General Programming",
    "__custom__",
  ];

  // Form State
  const [submissionType, setSubmissionType] = useState<"PDF_REPORT" | "CODING">("PDF_REPORT");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const [manualName, setManualName] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [batchId, setBatchId] = useState(batches[0]?.id || "");
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject || "Data Structures & Algorithms");
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [objective, setObjective] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("all");

  useEffect(() => {
    if (initialSubject) {
      if (PRESET_SUBJECTS.includes(initialSubject) && initialSubject !== "__custom__") {
        setSelectedSubject(initialSubject);
        setIsCustomSubject(false);
      } else {
        setSelectedSubject("__custom__");
        setIsCustomSubject(true);
        setCustomSubject(initialSubject);
      }
    }
  }, [initialSubject, show]);

  useEffect(() => {
    if (batches && batches.length > 0) {
      setLiveBatches(batches);
      if (!batchId || !batches.some((b) => b.id === batchId)) {
        setBatchId(batches[0]?.id || "");
      }
    }
  }, [batches]);

  useEffect(() => {
    if (show && (!liveBatches || liveBatches.length === 0)) {
      batchesApi
        .getAllBatches()
        .then((res) => {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            setLiveBatches(res.data);
            if (!batchId) {
              setBatchId(res.data[0]?.id || "");
            }
          }
        })
        .catch((err) => {
          console.warn("Could not load batches in modal:", err);
        });
    }
  }, [show, liveBatches]);
  const [starterCode, setStarterCode] = useState(
    `# Python 3 — Lab Experiment Starter Template\n# Implement your solution below\n\ndef solve():\n    # Read input from standard input\n    pass\n\nif __name__ == '__main__':\n    solve()\n`
  );
  const [totalPoints, setTotalPoints] = useState(100);
  const [dueDate, setDueDate] = useState("");
  const [timeLimit, setTimeLimit] = useState(2.0);
  const [memoryLimit, setMemoryLimit] = useState(128000);
  const [allowLate, setAllowLate] = useState(false);

  // Test Cases State
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: "tc_1",
      input: "5\n1 2 3 4 5",
      expectedOutput: "15",
      isHidden: false,
      weight: 1,
      explanation: "Sample Test 1: Sum of first 5 natural numbers",
    },
    {
      id: "tc_2",
      input: "3\n10 20 30",
      expectedOutput: "60",
      isHidden: true,
      weight: 2,
      explanation: "Hidden Edge Case 1",
    },
  ]);

  const LANGUAGE_TEMPLATES: Record<string, string> = {
    all: `# Any Language — Polyglot Lab Experiment Starter Template\n# Students can solve and submit this experiment in any supported language (Python, C++, Java, C, Go, Rust, JS, TS, R).\n\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()\n`,
    python: `# Python 3 — Lab Experiment Starter Template\n# Implement your solution below\n\ndef solve():\n    # Read input from standard input\n    pass\n\nif __name__ == '__main__':\n    solve()\n`,
    cpp: `// C++ 17 (GCC) — Lab Experiment Starter Template\n#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Read input and print output\n    return 0;\n}\n`,
    c: `// C (GCC 13) — Lab Experiment Starter Template\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    // Read input from stdin and print output\n    return 0;\n}\n`,
    java: `// Java 17 (OpenJDK) — Lab Experiment Starter Template\nimport java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input and process\n    }\n}\n`,
    javascript: `// Node.js 20 — Lab Experiment Starter Template\nconst fs = require('fs');\n\nfunction main() {\n  const input = fs.readFileSync(0, 'utf-8').trim();\n  // Process input and print solution\n}\n\nmain();\n`,
    typescript: `// TypeScript 5.3 — Lab Experiment Starter Template\nimport * as fs from 'fs';\n\nfunction solve(): void {\n  const input: string = fs.readFileSync(0, 'utf-8').trim();\n  // Implement solution\n}\n\nsolve();\n`,
    go: `// Go 1.22 — Lab Experiment Starter Template\npackage main\n\nimport (\n\t"bufio"\n\t"fmt"\n\t"os"\n)\n\nfunc main() {\n\tscanner := bufio.NewScanner(os.Stdin)\n\t// Read input and compute solution\n\t_ = scanner\n\tfmt.Println()\n}\n`,
    rust: `// Rust 1.76 — Lab Experiment Starter Template\nuse std::io::{self, Read};\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    // Parse input and compute solution\n}\n`,
    r: `# R 4.0.0 — Lab Experiment Starter Template\ninput <- readLines("stdin")\n# Process input and output results with cat() or print()\n`,
  };

  const SUPPORTED_LANGUAGES = [
    { id: "all", name: "✨ Any Language (All Languages Allowed / Polyglot)", group: "Students can submit in any supported language" },
    { id: "python", name: "Python 3.11", group: "General & Data Science" },
    { id: "cpp", name: "C++ 17 (GCC)", group: "Systems & Algorithms" },
    { id: "c", name: "C (GCC 13)", group: "Low-Level & Embedded" },
    { id: "java", name: "Java 17 (OpenJDK)", group: "Enterprise & OOP" },
    { id: "javascript", name: "JavaScript (Node.js 20)", group: "Web & Scripting" },
    { id: "typescript", name: "TypeScript 5.3", group: "Typed Web & Backend" },
    { id: "go", name: "Go (Golang 1.22)", group: "Cloud & Concurrency" },
    { id: "rust", name: "Rust 1.76", group: "Memory-Safe Systems" },
    { id: "r", name: "R (GNU R 4.0)", group: "Statistical Computing" },
  ];

  if (!show) return null;

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (
      starterCode.includes("Lab Experiment Starter Template") ||
      starterCode.trim() === "" ||
      Object.values(LANGUAGE_TEMPLATES).some((tpl) => tpl.trim() === starterCode.trim())
    ) {
      if (LANGUAGE_TEMPLATES[newLang]) {
        setStarterCode(LANGUAGE_TEMPLATES[newLang]);
      }
    }
  };

  const handleAddTestCase = (isHidden = false) => {
    setTestCases((prev) => [
      ...prev,
      {
        id: `tc_${Date.now()}_${prev.length + 1}`,
        input: "",
        expectedOutput: "",
        isHidden,
        weight: 1,
        explanation: isHidden ? `Hidden Test ${prev.length + 1}` : `Sample Test ${prev.length + 1}`,
      },
    ]);
  };

  const handleUpdateTestCase = (index: number, field: keyof TestCase, val: any) => {
    setTestCases((prev) => {
      const next = [...prev];
      const target = next[index];
      if (target) {
        next[index] = { ...target, [field]: val };
      }
      return next;
    });
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length <= 1) {
      showToast("At least one test case is required");
      return;
    }
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("Lab Assignment title is required");
      setActiveTab("details");
      return;
    }
    if (!objective.trim()) {
      showToast("Lab Experiment Objective is required 🎯");
      setActiveTab("details");
      return;
    }
    if (!description.trim()) {
      showToast("Problem description is required");
      setActiveTab("details");
      return;
    }
    if (!batchId) {
      showToast("Please select a target Batch");
      setActiveTab("details");
      return;
    }
    if (submissionType === "CODING" && (testCases.length === 0 || testCases.some((t) => !t.expectedOutput.trim()))) {
      showToast("Please provide expected output for all test cases");
      setActiveTab("tests");
      return;
    }

    try {
      setSubmitting(true);
      const resolvedSubject = isCustomSubject
        ? customSubject.trim() || "General Programming"
        : selectedSubject;

      let resolvedManualUrl = manualUrl;
      let resolvedManualName = manualName;
      if (manualFile) {
        try {
          const uploadRes = await labsApi.uploadDocument(manualFile);
          if (uploadRes?.data) {
            resolvedManualUrl = uploadRes.data.url;
            resolvedManualName = uploadRes.data.name;
          }
        } catch (uploadErr) {
          console.warn("Could not upload manual file:", uploadErr);
        }
      }

      const payload = {
        title: title.trim(),
        objective: objective.trim(),
        description: description.trim(),
        subject: resolvedSubject,
        prerequisites: prerequisites.trim() || undefined,
        batchId,
        submissionType,
        manualUrl: resolvedManualUrl || undefined,
        manualName: resolvedManualName || undefined,
        language: submissionType === "CODING" ? language : undefined,
        starterCode: submissionType === "CODING" ? starterCode : undefined,
        testCases: submissionType === "CODING" ? testCases : [],
        totalPoints: Number(totalPoints),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        timeLimit: Number(timeLimit),
        memoryLimit: Number(memoryLimit),
        allowLate,
        status: "PUBLISHED" as const,
      };

      const res = await labsApi.createLabAssignment(payload);
      if (res?.data) {
        onAssignmentCreated(res.data);
        showToast(`Lab "${res.data.title}" assigned to folder "${resolvedSubject}" successfully! 🚀`);
        onClose();
      } else {
        showToast("Created lab assignment locally");
        onClose();
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to create lab assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-[840px] max-h-[90vh] flex flex-col p-6 shadow-2xl z-10 overflow-hidden border" style={{ borderColor: "var(--bdr)" }}>
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--bdr)" }}>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl grid place-items-center bg-[#06b6d4]/10 text-[#06b6d4]">
              <FlaskConical size={20} />
            </div>
            <div>
              <h2 className="font-bold text-[18px] flex items-center gap-2">
                Assign Lab Experiment to Batch
              </h2>
              <p className="text-[12px]" style={{ color: "var(--t2)" }}>
                Author problem objectives, starter code, and automated test suites for students
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg grid place-items-center transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ color: "var(--t2)" }}
          >
            ✕
          </button>
        </div>

        {/* Format Selector: PDF Report (Default) vs Coding */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl border bg-black/5 dark:bg-white/5 my-3" style={{ borderColor: "var(--bdr)" }}>
          <button
            type="button"
            onClick={() => {
              setSubmissionType("PDF_REPORT");
              if (activeTab === "code" || activeTab === "tests") setActiveTab("details");
            }}
            className={`py-2 px-3 rounded-lg text-[12px] font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              submissionType === "PDF_REPORT"
                ? "bg-[#06b6d4] text-white shadow-md"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            style={{ color: submissionType === "PDF_REPORT" ? "#fff" : "var(--t2)" }}
          >
            📄 Document / PDF Report Upload (Default)
          </button>

          <button
            type="button"
            onClick={() => setSubmissionType("CODING")}
            className={`py-2 px-3 rounded-lg text-[12px] font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              submissionType === "CODING"
                ? "bg-[#06b6d4] text-white shadow-md"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            style={{ color: submissionType === "CODING" ? "#fff" : "var(--t2)" }}
          >
            ⚡ Coding Experiment (Judge0)
          </button>
        </div>

        {/* Wizard Step Tabs */}
        <div className="flex items-center gap-1 border-b py-2 text-[12px] font-semibold overflow-x-auto" style={{ borderColor: "var(--bdr)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "details"
                ? "bg-[#06b6d4] text-white shadow-sm"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            style={{ color: activeTab === "details" ? "#fff" : "var(--t2)" }}
          >
            <Target size={14} /> {submissionType === "PDF_REPORT" ? "1. Objective, Guidelines & Manual" : "1. Objective & Problem"}
          </button>

          {submissionType === "CODING" && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === "code"
                    ? "bg-[#06b6d4] text-white shadow-sm"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={{ color: activeTab === "code" ? "#fff" : "var(--t2)" }}
              >
                <FileCode size={14} /> 2. Starter Template
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tests")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === "tests"
                    ? "bg-[#06b6d4] text-white shadow-sm"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={{ color: activeTab === "tests" ? "#fff" : "var(--t2)" }}
              >
                <CheckCircle2 size={14} /> 3. Test Cases ({testCases.length})
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("limits")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "limits"
                ? "bg-[#06b6d4] text-white shadow-sm"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            style={{ color: activeTab === "limits" ? "#fff" : "var(--t2)" }}
          >
            <Sliders size={14} /> {submissionType === "PDF_REPORT" ? "2. Scoring & Deadline" : "4. Limits & Scoring"}
          </button>
        </div>

        {/* Tab Contents (Scrollable Body) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* TAB 1: OBJECTIVE & DETAILS */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                    Target Batch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border text-[13px] outline-none transition font-medium cursor-pointer"
                    style={{
                      background: "var(--srf2)",
                      borderColor: "var(--bdr)",
                      color: "var(--t1)",
                    }}
                  >
                    {liveBatches.length === 0 ? (
                      <option value="" disabled className="bg-neutral-900 text-white">
                        Loading batches...
                      </option>
                    ) : (
                      liveBatches.map((b) => (
                        <option key={b.id} value={b.id} className="bg-neutral-900 text-white">
                          {b.name} ({b.startYear} - {b.endYear})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                    Programming Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border text-[13px] outline-none transition font-medium cursor-pointer"
                    style={{
                      background: "var(--srf2)",
                      borderColor: "var(--bdr)",
                      color: "var(--t1)",
                    }}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id} className="bg-neutral-900 text-white">
                        {lang.name} — {lang.group}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject / Module Folder Selector */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between mb-1" style={{ color: "var(--t2)" }}>
                  <span className="flex items-center gap-1.5">
                    <Folder size={13} className="text-[#8b5cf6]" /> Subject / Module Folder <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-[#8b5cf6] font-semibold">Organizes experiment into subject folder</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      if (e.target.value === "__custom__") {
                        setIsCustomSubject(true);
                      } else {
                        setIsCustomSubject(false);
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl border text-[13px] outline-none transition font-medium cursor-pointer"
                    style={{
                      background: "var(--srf2)",
                      borderColor: "var(--bdr)",
                      color: "var(--t1)",
                    }}
                  >
                    {PRESET_SUBJECTS.map((s) => (
                      <option key={s} value={s} className="bg-neutral-900 text-white">
                        {s === "__custom__" ? "📁 + Create New / Custom Subject Folder..." : `📁 ${s}`}
                      </option>
                    ))}
                  </select>

                  {isCustomSubject && (
                    <Inp
                      placeholder="Type custom subject folder (e.g. Distributed Databases)"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="font-medium"
                      autoFocus
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                  Lab Experiment Title <span className="text-red-500">*</span>
                </label>
                <Inp
                  placeholder="e.g. Lab 4: Binary Search Trees & In-Order Traversal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-medium"
                />
              </div>

              {/* 🎯 LAB EXPERIMENT OBJECTIVE (PRIMARY FEATURE) */}
              <div className="p-4 rounded-xl border" style={{ background: "rgba(6, 182, 212, 0.05)", borderColor: "rgba(6, 182, 212, 0.3)" }}>
                <label className="text-[12px] font-bold flex items-center gap-1.5 text-[#06b6d4] uppercase tracking-wide mb-1">
                  <Target size={14} /> Lab Experiment Objective & Pedagogical Goals <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] mb-2" style={{ color: "var(--t2)" }}>
                  Clearly state what algorithm, system concept, or scientific problem the students are expected to solve and master.
                </p>
                <textarea
                  rows={3}
                  placeholder="e.g. Understand divide-and-conquer strategy, implement balanced tree insertions with O(log N) average time complexity, and handle duplicate node edge cases without memory leaks."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full p-3 rounded-xl border text-[12px] outline-none transition resize-none leading-relaxed font-sans"
                  style={{
                    background: "var(--srf)",
                    borderColor: "var(--bdr)",
                    color: "var(--t1)",
                  }}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                  Prerequisites & Knowledge Checks (Optional)
                </label>
                <Inp
                  placeholder="e.g. Recursion, Pointer manipulation, Big-O Time Complexity analysis"
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                  Full Problem Statement & Specifications <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Describe input format, output format, constraints (e.g. 1 <= N <= 10^5), and sample explanation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border text-[12px] outline-none transition resize-none leading-relaxed font-sans"
                  style={{
                    background: "var(--srf2)",
                    borderColor: "var(--bdr)",
                    color: "var(--t1)",
                  }}
                />
              </div>

              {/* Lab Manual / Guidelines PDF Uploader */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[12px] font-bold uppercase tracking-wider block" style={{ color: "var(--t2)" }}>
                  📎 Attach Experiment Manual / Guidelines PDF (Optional)
                </label>
                <div
                  className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
                  style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="h-9 w-9 rounded-lg grid place-items-center bg-[#8b5cf6]/10 text-[#8b5cf6] shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="truncate">
                      <div className="text-[12px] font-semibold truncate" style={{ color: "var(--t1)" }}>
                        {manualFile ? manualFile.name : manualName || "No manual attached"}
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--t3)" }}>
                        {manualFile
                          ? `${Math.round(manualFile.size / 1024)} KB • Ready to attach`
                          : "Upload a PDF guide or lab sheet for students to download"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {manualFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setManualFile(null);
                          setManualUrl(null);
                          setManualName(null);
                        }}
                        className="text-red-400 hover:text-red-300 text-[11px] font-semibold cursor-pointer px-2 py-1"
                      >
                        Remove
                      </button>
                    )}
                    <label className="h-8 px-3 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer" style={{ borderColor: "var(--bdr)", color: "var(--t1)", background: "var(--srf)" }}>
                      <Upload size={12} /> {manualFile ? "Change PDF" : "Choose PDF"}
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                              showToast("Please select a valid PDF file");
                              return;
                            }
                            setManualFile(file);
                            setManualName(file.name);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STARTER TEMPLATE */}
          {activeTab === "code" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[13px] flex items-center gap-1.5">
                    <FileCode size={15} className="text-[#06b6d4]" /> Starter Code Boilerplate
                  </h4>
                  <p className="text-[11px]" style={{ color: "var(--t2)" }}>
                    This boilerplate will pre-load in the student's Code Sandbox when they begin the experiment.
                  </p>
                </div>
                <Pill color="#06b6d4" className="capitalize">
                  {language}
                </Pill>
              </div>

              <textarea
                rows={12}
                value={starterCode}
                onChange={(e) => setStarterCode(e.target.value)}
                className="w-full p-3.5 rounded-xl border text-[12px] font-mono outline-none transition resize-none leading-relaxed"
                style={{
                  background: "#0d1b22",
                  borderColor: "var(--bdr)",
                  color: "#38bdf8",
                }}
              />
            </div>
          )}

          {/* TAB 3: TEST SUITE */}
          {activeTab === "tests" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[13px] flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-[#22c55e]" /> Unit Test Suite ({testCases.length})
                  </h4>
                  <p className="text-[11px]" style={{ color: "var(--t2)" }}>
                    Public tests provide instant student feedback in Sandbox; Hidden tests evaluate final grading.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Btn2
                    type="button"
                    onClick={() => handleAddTestCase(false)}
                    className="!h-8 text-[11px] !px-2.5 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Add Public Test
                  </Btn2>
                  <Btn
                    type="button"
                    onClick={() => handleAddTestCase(true)}
                    className="!h-8 text-[11px] !px-2.5 flex items-center gap-1 cursor-pointer !bg-[#8b5cf6] hover:!bg-[#7c3aed]"
                  >
                    <EyeOff size={13} /> Add Hidden Test
                  </Btn>
                </div>
              </div>

              <div className="space-y-3">
                {testCases.map((tc, idx) => (
                  <div
                    key={tc.id || idx}
                    className="p-4 rounded-xl border space-y-3 transition"
                    style={{
                      background: tc.isHidden ? "rgba(139, 92, 246, 0.05)" : "var(--srf2)",
                      borderColor: tc.isHidden ? "rgba(139, 92, 246, 0.3)" : "var(--bdr)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-md grid place-items-center text-[11px] font-bold font-mono bg-black/10 dark:bg-white/10">
                          #{idx + 1}
                        </span>
                        <Pill color={tc.isHidden ? "#8b5cf6" : "#06b6d4"}>
                          {tc.isHidden ? (
                            <>
                              <EyeOff size={11} /> Hidden Test Case
                            </>
                          ) : (
                            <>
                              <Eye size={11} /> Public Sample Case
                            </>
                          )}
                        </Pill>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span style={{ color: "var(--t2)" }}>Points Weight:</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={tc.weight || 1}
                            onChange={(e) => handleUpdateTestCase(idx, "weight", Number(e.target.value))}
                            className="w-12 h-6 px-1 text-center rounded border text-[11px] font-mono"
                            style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t1)" }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpdateTestCase(idx, "isHidden", !tc.isHidden)}
                          className="text-[11px] underline cursor-pointer"
                          style={{ color: "var(--t2)" }}
                        >
                          Toggle {tc.isHidden ? "Public" : "Hidden"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(idx)}
                          className="text-red-500 hover:text-red-600 transition p-1 cursor-pointer"
                          title="Remove test case"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 font-mono" style={{ color: "var(--t3)" }}>
                          Standard Input (stdin)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Leave empty if no input required"
                          value={tc.input}
                          onChange={(e) => handleUpdateTestCase(idx, "input", e.target.value)}
                          className="w-full p-2 rounded-lg border text-[11px] font-mono outline-none resize-none"
                          style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t1)" }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 font-mono" style={{ color: "var(--t3)" }}>
                          Expected Output (stdout) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Exact stdout match"
                          value={tc.expectedOutput}
                          onChange={(e) => handleUpdateTestCase(idx, "expectedOutput", e.target.value)}
                          className="w-full p-2 rounded-lg border text-[11px] font-mono outline-none resize-none"
                          style={{ background: "var(--srf)", borderColor: "var(--bdr)", color: "var(--t1)" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LIMITS & DEADLINES */}
          {activeTab === "limits" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                    Total Maximum Score (Points)
                  </label>
                  <Inp
                    type="number"
                    min={10}
                    max={1000}
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--t2)" }}>
                    Submission Deadline
                  </label>
                  <Inp
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                {submissionType === "CODING" && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1" style={{ color: "var(--t2)" }}>
                        <Clock size={12} /> Execution Timeout Limit (Seconds)
                      </label>
                      <Inp
                        type="number"
                        step="0.5"
                        min={0.5}
                        max={10}
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1" style={{ color: "var(--t2)" }}>
                        <Cpu size={12} /> Memory Limit (Kilobytes)
                      </label>
                      <Inp
                        type="number"
                        step="16000"
                        min={32000}
                        max={512000}
                        value={memoryLimit}
                        onChange={(e) => setMemoryLimit(Number(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="allowLateToggle"
                  checked={allowLate}
                  onChange={(e) => setAllowLate(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#06b6d4] cursor-pointer"
                />
                <label htmlFor="allowLateToggle" className="text-[12px] font-medium cursor-pointer" style={{ color: "var(--t1)" }}>
                  Allow Late Submissions after deadline with penalty tag
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t mt-auto" style={{ borderColor: "var(--bdr)" }}>
          <div className="text-[11px]" style={{ color: "var(--t3)" }}>
            {submissionType === "PDF_REPORT" ? (
              activeTab === "details"
                ? "Step 1 of 2: Define Objective, Guidelines & Manual"
                : "Step 2 of 2: Set Scoring & Deadline"
            ) : (
              <>
                {activeTab === "details" && "Step 1 of 4: Define Objective & Problem"}
                {activeTab === "code" && "Step 2 of 4: Prepare Starter Code"}
                {activeTab === "tests" && `Step 3 of 4: ${testCases.length} Test Cases configured`}
                {activeTab === "limits" && "Step 4 of 4: Set Marks & Limits"}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Btn2 type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </Btn2>

            {activeTab !== "limits" ? (
              <Btn
                type="button"
                onClick={() => {
                  if (submissionType === "PDF_REPORT") {
                    setActiveTab("limits");
                  } else {
                    if (activeTab === "details") setActiveTab("code");
                    else if (activeTab === "code") setActiveTab("tests");
                    else if (activeTab === "tests") setActiveTab("limits");
                  }
                }}
                className="cursor-pointer"
              >
                Next Step →
              </Btn>
            ) : (
              <Btn
                type="button"
                onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                disabled={submitting}
                className="cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles size={14} /> {submitting ? "Assigning..." : "Publish & Assign Lab"}
              </Btn>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CreateLabAssignmentModal;
