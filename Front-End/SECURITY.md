# GiteaForge — Security Implementation Guide

## Overview of Security Measures

This document describes all client-side and recommended server-side security measures implemented in GiteaForge.

---

## 1. Client-Side Security (Frontend)

### 1.1 Input Sanitization (XSS Prevention)
**File:** `src/utils/security.ts`

All user text inputs are sanitized before being stored in state or sent to the API:
- `sanitizeInput()` — Encodes `< > " ' / \`` characters to HTML entities
- `stripHTML()` — Strips all HTML tags from display text
- `sanitizeForDB()` — Removes MongoDB operator characters (`$`, `{}`) and SQL injection patterns (`; -- /* */`)
- `sanitizeFileName()` — Strips dangerous characters from file names
- `sanitizeURL()` — Only allows `http:` and `https:` protocols

**Where applied:**
- Login form (email field)
- Signup form (all text fields except passwords)
- All text inputs across dashboards go through sanitization before API calls

### 1.2 Form Validation
Every form has comprehensive validation before submission:

**Login:**
- Email format validation (RFC 5322 pattern)
- Email max length 254 characters
- Password required check
- Error messages shown inline with red borders

**Signup Step 1 — Personal Info:**
- Full Name: 2-100 chars, only letters/spaces/hyphens/apostrophes/dots, supports Unicode
- Email: RFC 5322 format, max 254 chars
- Phone: 10-15 digits, optional `+` prefix
- Password: Strength check (see 1.3)
- Confirm Password: Must match password exactly

**Signup Step 2 — Academic Info:**
- University: Required
- Department: Required (dropdown)
- Session: Required (dropdown)
- Roll Number: 3-30 chars, alphanumeric with hyphens/slashes only
- Terms checkbox: Must be accepted

### 1.3 Password Strength Meter
**Visual indicator with 5 levels:** Very Weak → Weak → Fair → Strong → Very Strong

Checks for:
- Minimum 8 characters (required)
- 12+ characters (bonus)
- Lowercase letters
- Uppercase letters
- Numbers
- Special characters
- Common password patterns (rejected): `123...`, `password`, `qwerty`, `admin`, etc.
- Repeated characters (penalized)

Password must score "Fair" or higher to be accepted.

### 1.4 Rate Limiting (Client-Side)
Prevents rapid repeated actions:
- **Login:** Max 5 attempts per 60 seconds
- **Forgot Password:** Max 3 attempts per 120 seconds
- **Signup:** Max 3 attempts per 300 seconds

Shows countdown timer when limit is reached.

### 1.5 Anti-Clickjacking
- `preventClickjacking()` runs on mount — detects if page is loaded in an iframe
- If detected, page content is replaced with a warning message
- HTML `<meta>` tag: `X-Frame-Options: DENY`

### 1.6 Session Timeout
- **30-minute inactivity timeout** — auto-logs out the user
- **5-minute warning** — shows toast notification before timeout
- Activity detection: mouse, keyboard, scroll, touch events reset the timer
- On timeout: clears all tokens, redirects to login

### 1.7 Secure Storage
`secureStorage` wrapper around localStorage:
- Base64 encodes values (obfuscation, not encryption)
- Prefixes all keys with `giteaforge_` to avoid collisions
- `clear()` method removes only GiteaForge keys
- Handles storage errors gracefully

### 1.8 Password Visibility Toggle
- Eye/EyeOff icon button on password fields
- `tabIndex={-1}` so it doesn't interfere with form tab order
- Proper `aria-label` for screen readers

### 1.9 ARIA Accessibility
- `aria-invalid` on fields with validation errors
- `aria-describedby` linking error messages to inputs
- `aria-label` on icon buttons (dark mode toggle, password visibility)
- Keyboard navigation: Enter key submits forms
- Focus rings on interactive elements

---

## 2. HTTP Security Headers (index.html)

```html
<!-- Prevent MIME type sniffing -->
<meta http-equiv="X-Content-Type-Options" content="nosniff" />

<!-- Prevent page from being loaded in iframes -->
<meta http-equiv="X-Frame-Options" content="DENY" />

<!-- Enable browser XSS filter -->
<meta http-equiv="X-XSS-Protection" content="1; mode=block" />

<!-- Control referrer information -->
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

<!-- Disable unused browser features -->
<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=()" />

<!-- Content Security Policy -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob:;
  connect-src 'self' http://localhost:5000;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
" />
```

---

## 3. API Client Security (`src/api/client.ts`)

### 3.1 Request Interceptor
Every outgoing request automatically:
1. Attaches JWT token from localStorage via `Authorization: Bearer <token>`
2. Attaches CSRF token via `X-CSRF-Token` header on POST/PUT/PATCH/DELETE
3. Sanitizes request body (recursively sanitizes strings, blocks `__proto__`/`constructor`/`prototype` keys)
4. Adds `X-Request-Timestamp` header for replay attack detection
5. Sends `X-Requested-With: XMLHttpRequest` to identify AJAX calls
6. Enables `withCredentials: true` for CSRF cookie support

### 3.2 Response Interceptor
1. Extracts and stores CSRF tokens from response headers
2. On 401: Attempts token refresh, retries original request, or forces logout
3. On 403: Logs access denied
4. On 429: Logs rate limit hit
5. Error messages are sanitized — server error details are not leaked to UI

### 3.3 Prototype Pollution Prevention
Request body sanitizer blocks keys named `__proto__`, `constructor`, `prototype` — prevents prototype pollution attacks.

---

## 4. File Upload Security

`validateFile()` in `src/utils/security.ts`:
- **Allowed MIME types:** PDF, PPT, PPTX, ZIP, PNG, JPEG, GIF, TXT, Markdown
- **Max file size:** 25MB
- **Empty file check**
- **Filename sanitization:** Rejects `< > : " / \ | ? *` characters

---

## 5. Recommended Server-Side Security

The frontend is hardened, but the backend MUST also implement:

### 5.1 Authentication
- bcrypt password hashing (cost factor 12+)
- JWT with short expiry (15 min access, 7 day refresh)
- Refresh token rotation (invalidate old refresh token on use)
- Account lockout after 10 failed login attempts

### 5.2 Authorization
- Role-based access control middleware
- Students can only access their own projects
- Professors can only access assigned projects
- Admin has full access
- Verify ownership on every mutating request

### 5.3 Input Validation (Server)
- Use `express-validator` or `joi` for schema validation
- Validate and sanitize ALL inputs (don't trust client-side validation)
- Parameterized MongoDB queries (use Mongoose, never raw `$where`)
- Reject requests with unexpected fields

### 5.4 Headers (Express)
```js
const helmet = require('helmet');
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"],
  }
}));
```

### 5.5 Rate Limiting (Server)
```js
const rateLimit = require('express-rate-limit');
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

### 5.6 CSRF Protection
```js
const csrf = require('csurf');
app.use(csrf({ cookie: { httpOnly: true, secure: true, sameSite: 'strict' } }));
// Return token in response header: res.set('X-CSRF-Token', req.csrfToken());
```

### 5.7 CORS
```js
const cors = require('cors');
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
}));
```

### 5.8 File Upload (Server)
- Re-validate MIME type on server (don't trust Content-Type header)
- Use `file-type` package to check magic bytes
- Store files outside web root
- Generate random filenames (don't use user-provided names)
- Scan for malware if possible
- Set `Content-Disposition: attachment` on downloads

### 5.9 Database Security
- Use Mongoose schemas with strict mode
- Never use `$where` or `eval`
- Sanitize query parameters: `mongo-sanitize` package
- Enable MongoDB authentication
- Use a separate database user with minimal permissions

### 5.10 Gitea API Security
- Store Gitea admin token in environment variables only
- Never expose Gitea admin token to frontend
- Proxy all Gitea API calls through your backend
- Validate webhook signatures (HMAC-SHA256)
- Use per-user Gitea tokens, not the admin token

---

## 6. Security Checklist

### Frontend (Implemented ✅)
- [x] XSS input sanitization
- [x] HTML entity encoding
- [x] Form validation (email, password, phone, name, roll number)
- [x] Password strength meter with policy enforcement
- [x] Client-side rate limiting
- [x] Anti-clickjacking detection
- [x] Session timeout with warning
- [x] Secure storage wrapper
- [x] CSP meta tags
- [x] X-Frame-Options DENY
- [x] X-Content-Type-Options nosniff
- [x] Referrer-Policy
- [x] Permissions-Policy
- [x] CSRF token handling in API client
- [x] JWT auto-injection
- [x] Token refresh with retry
- [x] Prototype pollution prevention
- [x] File upload validation (type, size, name)
- [x] SQL/NoSQL injection sanitization
- [x] Error message sanitization (no server details leaked)
- [x] Password visibility toggle
- [x] ARIA accessibility for validation
- [x] maxLength on all inputs

### Backend (Must Implement)
- [ ] bcrypt password hashing
- [ ] JWT with short expiry + refresh rotation
- [ ] helmet.js security headers
- [ ] CORS whitelist
- [ ] Server-side rate limiting
- [ ] Server-side CSRF tokens
- [ ] Input validation with express-validator/joi
- [ ] MongoDB injection prevention
- [ ] File upload re-validation
- [ ] Gitea token isolation
- [ ] Webhook HMAC verification
- [ ] Audit logging
- [ ] Account lockout policy
- [ ] HTTPS enforcement
- [ ] HTTP Strict-Transport-Security (HSTS)
