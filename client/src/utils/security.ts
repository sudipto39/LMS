// src/utils/security.ts
/**
 * ============================================
 * GiteaForge LMS — Production Security Utilities
 * ============================================
 * - Client-side XSS input sanitization
 * - Safe URL & file validation
 * - Password strength metrics
 * - Rate limiting
 * - CSRF token management
 */

// ── XSS Sanitization ───────────────────────────────────────────────────────────
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/`/g, "&#96;");
}

export function stripHTML(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "");
}

export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .substring(0, 255);
}

// ── SQL / NoSQL Injection Prevention for query strings ────────────────────────
// ⚠️  DO NOT use this on data sent to the API — the backend uses Prisma with
// parameterized queries which already prevents SQL/NoSQL injection.
// Applying this strips legitimate characters ($, {}, ;) from user content such
// as code snippets, project descriptions, and JSON values.
// Only use this for display-only label sanitization where truly needed.
/** @deprecated Use only for sanitizing non-API display-only strings. API data is safe via Prisma. */
export function sanitizeDisplayLabel(input: string): string {
  if (!input) return "";
  return input
    .replace(/--/g, "")       // SQL comment
    .replace(/\/\*/g, "")     // Block comment start
    .replace(/\*\//g, "")     // Block comment end
    .trim();
}

/** @deprecated Legacy alias — do not use for data bound for API calls. */
export const sanitizeForDB = sanitizeDisplayLabel;

// ── Email Validation ──────────────────────────────────────────────────────────
export function validateEmail(email: string): { valid: boolean; error: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: "Email is required" };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  if (email.length > 254) {
    return { valid: false, error: "Email address is too long" };
  }
  return { valid: true, error: "" };
}

// ── Password Strength Evaluation ──────────────────────────────────────────────
export interface PasswordStrength {
  score: number; // 0-5
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  color: string;
  suggestions: string[];
  valid: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  if (!password) {
    return {
      score: 0,
      label: "Very Weak",
      color: "bg-red-500",
      suggestions: ["Enter a password"],
      valid: false,
    };
  }

  if (password.length >= 8) score++;
  else suggestions.push("Use at least 8 characters");

  if (password.length >= 12) score++;
  else if (password.length >= 8)
    suggestions.push("Use 12+ characters for better security");

  if (/[a-z]/.test(password)) score += 0.5;
  else suggestions.push("Add lowercase letters");

  if (/[A-Z]/.test(password)) score += 0.5;
  else suggestions.push("Add uppercase letters");

  if (/[0-9]/.test(password)) score += 0.5;
  else suggestions.push("Add numbers");

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 0.5;
  else suggestions.push("Add special characters (!@#$%^&*)");

  const commonPatterns = [
    /^123/,
    /^password/i,
    /^qwerty/i,
    /^admin/i,
    /^welcome/i,
    /^abc123/i,
    /^111/,
    /^12345/,
  ];

  if (commonPatterns.some((p) => p.test(password))) {
    score = Math.max(0, score - 2);
    suggestions.push("Avoid common password sequences");
  }

  const finalScore = Math.min(5, Math.round(score));
  const labels: PasswordStrength["label"][] = [
    "Very Weak",
    "Weak",
    "Fair",
    "Strong",
    "Very Strong",
  ];
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];
  const idx = Math.min(4, Math.max(0, finalScore - 1));

  return {
    score: finalScore,
    label: finalScore === 0 ? "Very Weak" : labels[idx],
    color: finalScore === 0 ? "bg-red-500" : colors[idx],
    suggestions: suggestions.slice(0, 3),
    valid: finalScore >= 3 && password.length >= 8,
  };
}

// ── Rate Limiting (Client-side anti-spam) ───────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  action: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(action);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(action, { count: 1, resetTime: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= maxAttempts) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

export function resetRateLimit(action: string): void {
  rateLimitMap.delete(action);
}

// ── CSRF Management ───────────────────────────────────────────────────────────
let _csrfToken: string | null = null;

export function setCSRFToken(token: string): void {
  _csrfToken = token;
}

export function getCSRFToken(): string | null {
  if (_csrfToken) return _csrfToken;
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]*)/);
    if (match && match[1]) {
      _csrfToken = decodeURIComponent(match[1]);
      return _csrfToken;
    }
  }
  return _csrfToken;
}

// ── CSV Formula Injection Defense (CWE-1236) ──────────────────────────────────
export function sanitizeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // If formula trigger character at start, prefix with single quote to neutralize
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape double quotes by doubling them: " -> ""
  return `"${str.replace(/"/g, '""')}"`;
}

// ── File Validation ───────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-tar",
  "application/gzip",
  "image/png",
  "image/jpeg",
  "image/gif",
  "text/plain",
  "text/markdown",
  "text/x-patch",
  "text/csv",
  "application/vnd.ms-excel",
  "text/comma-separated-values",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateFile(file: File): { valid: boolean; error: string } {
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    // Check extension as secondary fallback
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExts = [
      "pdf",
      "ppt",
      "pptx",
      "zip",
      "tar",
      "gz",
      "patch",
      "diff",
      "png",
      "jpg",
      "jpeg",
      "txt",
      "md",
      "csv",
    ];
    if (!ext || !allowedExts.includes(ext)) {
      return {
        valid: false,
        error: `File type "${file.name}" is not supported. Allowed: PDF, PPT, ZIP, TAR, PATCH, CSV, images.`,
      };
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 50MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "File cannot be empty" };
  }

  if (/[<>:"/\\|?*]/.test(file.name)) {
    return { valid: false, error: "File name contains invalid characters" };
  }

  return { valid: true, error: "" };
}
