// src/types/sandbox.ts

export interface SandboxLanguage {
  id: string;
  name: string;
  ver: string;
  ext: string;
  template: string;
}

export interface ExecutionResult {
  output: string;
  status: "success" | "error" | "timeout";
  executionTimeMs?: number;
  memoryKb?: number;
  exitCode?: number;
}

export interface SandboxHistoryItem {
  lang: string;
  code: string;
  output: string;
  time: string;
}
