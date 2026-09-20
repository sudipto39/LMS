// src/types/index.ts

export * from "./user";
export * from "./auth";
export * from "./project";
export * from "./milestone";
export * from "./academic";
export * from "./feedback";
export * from "./sandbox";
export * from "./admin";
export * from "./lab";
export * from "./problemStatement";
export * from "./evaluation";

export interface ApiResponse<T> {
  status: "success" | "fail" | "error";
  data?: T;
  message?: string;
  count?: number;
}
