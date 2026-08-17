#!/usr/bin/env node

/**
 * ============================================================================
 * Production / Staging Post-Deployment Smoke Test Script
 * ============================================================================
 * Usage:
 *   node scripts/smoke-test.js [target_url]
 *
 * Examples:
 *   node scripts/smoke-test.js http://localhost:5000
 *   node scripts/smoke-test.js https://lms-backend-xyz.a.run.app
 * ============================================================================
 */

const targetUrl = (process.argv[2] || process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");

console.log(`\n?? Running Post-Deployment Smoke Tests against: ${targetUrl}\n${"=".repeat(65)}`);

let passed = 0;
let failed = 0;

async function runCheck(name, checkFn) {
  const start = Date.now();
  try {
    await checkFn();
    const duration = Date.now() - start;
    console.log(`  ? [PASS] ${name} (${duration}ms)`);
    passed++;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`  ? [FAIL] ${name} (${duration}ms): ${error.message}`);
    failed++;
  }
}

async function startSmokeTests() {
  // Check 1: Health probe
  await runCheck("Container Health & Liveness Probe (GET /health)", async () => {
    const res = await fetch(`${targetUrl}/health`);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const json = await res.json();
    if (json.status !== "ok") throw new Error(`Expected { status: 'ok' }, got ${JSON.stringify(json)}`);
  });

  // Check 2: API Root endpoint
  await runCheck("Root Info Endpoint (GET /)", async () => {
    const res = await fetch(`${targetUrl}/`);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const json = await res.json();
    if (json.status !== "success") throw new Error(`Expected status: 'success'`);
  });

  // Check 3: Security Headers (Helmet)
  await runCheck("Security Headers Inspection (X-Content-Type-Options: nosniff)", async () => {
    const res = await fetch(`${targetUrl}/health`);
    const nosniff = res.headers.get("x-content-type-options");
    if (nosniff !== "nosniff") throw new Error(`Missing or invalid x-content-type-options header: ${nosniff}`);
    const poweredBy = res.headers.get("x-powered-by");
    if (poweredBy) throw new Error(`Server is exposing x-powered-by: ${poweredBy}`);
  });

  // Check 4: RBAC Protection
  await runCheck("Route Security Guard (GET /api/v1/admin/stats returns 401 Unauthorized)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/admin/stats`);
    if (res.status !== 401) throw new Error(`Expected HTTP 401 Unauthorized, got ${res.status}`);
  });

  // Check 5: Webhook Forgery Protection
  await runCheck("Webhook Security Guard (POST /api/v1/webhooks/gitea rejects forged signature)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/webhooks/gitea`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-gitea-signature": "sha256=invalid0000000000000000000000000000000000000000000000000000000000",
        "x-gitea-event": "push",
      },
      body: JSON.stringify({ repository: { name: "test" } }),
    });
    if (res.status !== 401) throw new Error(`Expected HTTP 401 on forged signature, got ${res.status}`);
  });

  console.log(`${"=".repeat(65)}\n?? Results: ${passed} Passed, ${failed} Failed`);

  if (failed > 0) {
    console.error("?? Smoke tests failed! Check container logs on Cloud Run.\n");
    process.exit(1);
  } else {
    console.log("?? All post-deployment smoke tests passed successfully!\n");
    process.exit(0);
  }
}

startSmokeTests();
