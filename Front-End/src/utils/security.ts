/**
 * ============================================
 * GiteaForge — Security Utilities
 * ============================================
 * Client-side security hardening:
 * - Input sanitization (XSS prevention)
 * - Form validation
 * - Password strength checking
 * - Rate limiting
 * - CSRF token handling
 * - Content Security Policy helpers
 * - Secure storage wrappers
 */

// ── XSS Sanitization ──
// Strips all HTML tags and encodes dangerous characters
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;');
}

// Strip HTML tags completely (for display text)
export function stripHTML(input: string): string {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '');
}

// Sanitize for URL parameters (prevent injection)
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

// Sanitize file names
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}


// ── Email Validation ──
export function validateEmail(email: string): { valid: boolean; error: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  if (email.length > 254) {
    return { valid: false, error: 'Email address is too long' };
  }
  return { valid: true, error: '' };
}


// ── Password Strength ──
export interface PasswordStrength {
  score: number; // 0-5
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
  suggestions: string[];
  valid: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  if (!password) {
    return { score: 0, label: 'Very Weak', color: 'bg-red-500', suggestions: ['Enter a password'], valid: false };
  }

  // Length checks
  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score++;
  else if (password.length >= 8) suggestions.push('Use 12+ characters for better security');

  // Character variety
  if (/[a-z]/.test(password)) score += 0.5;
  else suggestions.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 0.5;
  else suggestions.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 0.5;
  else suggestions.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 0.5;
  else suggestions.push('Add special characters (!@#$%^&*)');

  // Common password patterns (reject)
  const commonPatterns = [
    /^123/, /^password/i, /^qwerty/i, /^admin/i,
    /^letmein/i, /^welcome/i, /^abc123/i, /^111/,
    /^12345/, /^iloveyou/i, /^monkey/i, /^dragon/i,
  ];

  if (commonPatterns.some(p => p.test(password))) {
    score = Math.max(0, score - 2);
    suggestions.push('Avoid common password patterns');
  }

  // Sequential characters
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push('Avoid repeated characters');
  }

  const finalScore = Math.min(5, Math.round(score));

  const labels: PasswordStrength['label'][] = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  const idx = Math.min(4, Math.max(0, finalScore - 1));

  return {
    score: finalScore,
    label: finalScore === 0 ? 'Very Weak' : labels[idx],
    color: finalScore === 0 ? 'bg-red-500' : colors[idx],
    suggestions: suggestions.slice(0, 3),
    valid: finalScore >= 3 && password.length >= 8,
  };
}


// ── Phone Number Validation ──
export function validatePhone(phone: string): { valid: boolean; error: string } {
  if (!phone || !phone.trim()) {
    return { valid: false, error: 'Phone number is required' };
  }
  // Remove spaces, dashes, dots for validation
  const cleaned = phone.replace(/[\s\-().]/g, '');
  // Must be 10-15 digits, optionally starting with +
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: 'Enter a valid phone number (10-15 digits)' };
  }
  return { valid: true, error: '' };
}


// ── Name Validation ──
export function validateName(name: string): { valid: boolean; error: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Name is required' };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (name.trim().length > 100) {
    return { valid: false, error: 'Name is too long (max 100 characters)' };
  }
  // Only allow letters, spaces, hyphens, apostrophes, dots
  if (!/^[a-zA-Z\s'\-.\u00C0-\u024F\u0900-\u097F]+$/.test(name.trim())) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  return { valid: true, error: '' };
}


// ── Roll Number Validation ──
export function validateRollNo(rollNo: string): { valid: boolean; error: string } {
  if (!rollNo || !rollNo.trim()) {
    return { valid: false, error: 'Roll number is required' };
  }
  if (rollNo.trim().length < 3) {
    return { valid: false, error: 'Roll number must be at least 3 characters' };
  }
  if (rollNo.trim().length > 30) {
    return { valid: false, error: 'Roll number is too long' };
  }
  // Alphanumeric with optional hyphens and slashes
  if (!/^[a-zA-Z0-9\-/]+$/.test(rollNo.trim())) {
    return { valid: false, error: 'Roll number can only contain letters, numbers, hyphens, and slashes' };
  }
  return { valid: true, error: '' };
}


// ── Generic Required Field ──
export function validateRequired(value: string, fieldName: string): { valid: boolean; error: string } {
  if (!value || !value.trim()) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true, error: '' };
}


// ── Max Length Check ──
export function validateMaxLength(value: string, max: number, fieldName: string): { valid: boolean; error: string } {
  if (value.length > max) {
    return { valid: false, error: `${fieldName} cannot exceed ${max} characters` };
  }
  return { valid: true, error: '' };
}


// ── Full Signup Form Validation ──
export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  department: string;
  session: string;
  university: string;
  rollNo: string;
  termsAccepted: boolean;
}

export interface SignupValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof SignupFormData, string>>;
}

export function validateSignupStep1(data: SignupFormData): SignupValidationResult {
  const errors: Partial<Record<keyof SignupFormData, string>> = {};

  const name = validateName(data.fullName);
  if (!name.valid) errors.fullName = name.error;

  const email = validateEmail(data.email);
  if (!email.valid) errors.email = email.error;

  const phone = validatePhone(data.phoneNumber);
  if (!phone.valid) errors.phoneNumber = phone.error;

  const pw = checkPasswordStrength(data.password);
  if (!pw.valid) errors.password = 'Password is too weak. ' + pw.suggestions[0];

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSignupStep2(data: SignupFormData): SignupValidationResult {
  const errors: Partial<Record<keyof SignupFormData, string>> = {};

  const uni = validateRequired(data.university, 'University');
  if (!uni.valid) errors.university = uni.error;

  const dept = validateRequired(data.department, 'Department');
  if (!dept.valid) errors.department = dept.error;

  const session = validateRequired(data.session, 'Session');
  if (!session.valid) errors.session = session.error;

  const roll = validateRollNo(data.rollNo);
  if (!roll.valid) errors.rollNo = roll.error;

  if (!data.termsAccepted) {
    errors.termsAccepted = 'You must accept the terms and privacy policy';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}


// ── Login Form Validation ──
export function validateLogin(email: string, password: string): { valid: boolean; errors: { email?: string; password?: string } } {
  const errors: { email?: string; password?: string } = {};

  const emailResult = validateEmail(email);
  if (!emailResult.valid) errors.email = emailResult.error;

  if (!password || !password.trim()) {
    errors.password = 'Password is required';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}


// ── Rate Limiting (client-side) ──
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(action: string, maxAttempts: number = 5, windowMs: number = 60000): { allowed: boolean; retryAfter: number } {
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


// ── Secure Storage (wrapper around localStorage) ──
// Prevents storing sensitive data in plain text
const STORAGE_PREFIX = 'giteaforge_';

export const secureStorage = {
  set(key: string, value: string): void {
    try {
      // Base64 encode (not encryption, but obfuscation for casual inspection)
      // Real encryption should be done server-side
      const encoded = btoa(unescape(encodeURIComponent(value)));
      localStorage.setItem(STORAGE_PREFIX + key, encoded);
    } catch {
      // Storage full or disabled
      console.warn('Failed to write to storage');
    }
  },

  get(key: string): string | null {
    try {
      const encoded = localStorage.getItem(STORAGE_PREFIX + key);
      if (!encoded) return null;
      return decodeURIComponent(escape(atob(encoded)));
    } catch {
      return null;
    }
  },

  remove(key: string): void {
    localStorage.removeItem(STORAGE_PREFIX + key);
  },

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(k);
      }
    });
  },
};


// ── CSRF Token ──
let csrfToken: string | null = null;

export function setCSRFToken(token: string): void {
  csrfToken = token;
}

export function getCSRFToken(): string | null {
  return csrfToken;
}


// ── File Upload Validation ──
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'image/png',
  'image/jpeg',
  'image/gif',
  'text/plain',
  'text/markdown',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function validateFile(file: File): { valid: boolean; error: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `File type "${file.type}" is not allowed. Allowed: PDF, PPT, ZIP, images, text.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 25MB.` };
  }
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }
  // Check filename
  if (/[<>:"/\\|?*]/.test(file.name)) {
    return { valid: false, error: 'Filename contains invalid characters' };
  }
  return { valid: true, error: '' };
}


// ── Prevent Clickjacking ──
export function preventClickjacking(): void {
  if (window.self !== window.top) {
    // Page is in an iframe — possible clickjacking
    document.body.innerHTML = '<h1 style="text-align:center;margin-top:100px;">This page cannot be displayed in a frame.</h1>';
    throw new Error('Clickjacking detected: page loaded in iframe');
  }
}


// ── Session Timeout ──
let sessionTimer: ReturnType<typeof setTimeout> | null = null;
let activityTimer: ReturnType<typeof setTimeout> | null = null;

export function startSessionTimeout(
  timeoutMs: number = 30 * 60 * 1000, // 30 minutes
  onTimeout: () => void,
  warningMs: number = 5 * 60 * 1000, // 5 minutes before
  onWarning?: () => void,
): void {
  clearSessionTimeout();

  if (onWarning) {
    activityTimer = setTimeout(() => {
      onWarning();
    }, timeoutMs - warningMs);
  }

  sessionTimer = setTimeout(() => {
    onTimeout();
  }, timeoutMs);
}

export function resetSessionTimeout(
  timeoutMs: number = 30 * 60 * 1000,
  onTimeout: () => void,
  warningMs: number = 5 * 60 * 1000,
  onWarning?: () => void,
): void {
  startSessionTimeout(timeoutMs, onTimeout, warningMs, onWarning);
}

export function clearSessionTimeout(): void {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (activityTimer) clearTimeout(activityTimer);
  sessionTimer = null;
  activityTimer = null;
}


// ── SQL / NoSQL Injection Prevention (input sanitizer) ──
export function sanitizeForDB(input: string): string {
  if (!input) return '';
  return input
    .replace(/[$]/g, '') // MongoDB operator injection
    .replace(/[{}]/g, '') // Object injection
    .replace(/;/g, '') // SQL terminator
    .replace(/--/g, '') // SQL comment
    .replace(/\/\*/g, '') // Block comment start
    .replace(/\*\//g, '') // Block comment end
    .replace(/'/g, "\\'") // Escape single quotes
    .replace(/"/g, '\\"') // Escape double quotes
    .trim();
}


// ── Content Security helpers ──
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
