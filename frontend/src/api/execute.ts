// src/api/execute.ts
import client from "./client";
import type { ExecutionResult, ApiResponse } from "../types";

export interface CodeExecutionPayload {
  language: string;
  sourceCode: string;
  stdin?: string;
  expectedOutput?: string;
}

export const executeApi = {
  runCode: async (payload: CodeExecutionPayload): Promise<ApiResponse<ExecutionResult>> => {
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
    const lang = (payload.language || "python").toLowerCase();
    const ext = extMap[lang] || "txt";
    const filename = `main.${ext}`;

    const body = {
      engine: lang,
      language: lang,
      sourceCode: payload.sourceCode,
      selectedFilePath: filename,
      files: [
        {
          name: filename,
          path: filename,
          content: payload.sourceCode,
        },
      ],
      stdin: payload.stdin || "",
      expectedOutput: payload.expectedOutput,
    };

    const res = await client.post<ApiResponse<ExecutionResult>>("/v1/execute", body);
    return res.data;
  },

  getLanguages: async (): Promise<ApiResponse<Array<{ id: string; name: string; version: string }>>> => {
    const res = await client.get<ApiResponse<Array<{ id: string; name: string; version: string }>>>("/v1/execute/languages");
    return res.data;
  },

  getTemplate: async (language: string): Promise<ApiResponse<{ language: string; template: string }>> => {
    const res = await client.get<ApiResponse<{ language: string; template: string }>>(`/v1/execute/templates/${language}`);
    return res.data;
  },
};

export default executeApi;
