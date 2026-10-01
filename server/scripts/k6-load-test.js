import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

/**
 * ============================================================================
 * GiteaForge / LMS Express Backend - Grafana k6 Multi-Stage 10k Load & Stress Test
 * ============================================================================
 * Usage:
 *   npm run test:k6
 *   node scripts/run-k6.js
 *   node scripts/run-k6.js -e TARGET_URL=https://lms-backend-xyz.a.run.app -e TARGET_USERS=10000
 * ============================================================================
 */

export const errorRate = new Rate("errors");

const TARGET_URL = (__ENV.TARGET_URL || "http://localhost:5000").replace(/\/$/, "");
const TARGET_USERS = Number(__ENV.TARGET_USERS || 10000);

export const options = {
  // Automated Quality Gates (Thresholds)
  thresholds: {
    // 95% of requests must complete below 1000ms; 99% below 2500ms under 10k peak load
    http_req_duration: ["p(95)<1000", "p(99)<2500"],
    // Error rate must remain strictly below 2% under peak stress
    errors: ["rate<0.02"],
    http_req_failed: ["rate<0.02"],
  },

  // Multi-Stage Traffic Simulation (Scaled to 10k Users)
  stages: [
    { duration: "20s", target: Math.round(TARGET_USERS * 0.1) },  // Stage 1: Warmup & ramp up to 1,000 users
    { duration: "30s", target: Math.round(TARGET_USERS * 0.3) },  // Stage 2: Heavy traffic surge to 3,000 users
    { duration: "45s", target: Math.round(TARGET_USERS * 0.6) },  // Stage 3: High concurrency push to 6,000 users
    { duration: "1m",  target: TARGET_USERS },                     // Stage 4: Massive 10k peak stress surge
    { duration: "1m",  target: TARGET_USERS },                     // Stage 5: Sustain 10k peak load
    { duration: "30s", target: 0 },                                // Stage 6: Ramp down / system recovery
  ],
};

export default function () {
  // 1. Health Probe Request
  {
    const res = http.get(`${TARGET_URL}/health`);
    const isSuccess = check(res, {
      "health status is 200": (r) => r.status === 200,
      "health status is ok": (r) => r.json("status") === "ok",
    });
    errorRate.add(!isSuccess);
  }

  sleep(0.2);

  // 2. API Root Info Request
  {
    const res = http.get(`${TARGET_URL}/`);
    const isSuccess = check(res, {
      "root status is 200": (r) => r.status === 200,
    });
    errorRate.add(!isSuccess);
  }

  sleep(0.2);

  // 3. Security Guard Check (401 unauthorized or 429 rate limit is expected and valid)
  {
    const res = http.get(`${TARGET_URL}/api/v1/admin/stats`, {
      responseCallback: http.expectedStatuses(401, 429),
    });
    const isSuccess = check(res, {
      "unauthorized admin request blocked with 401 or 429": (r) => r.status === 401 || r.status === 429,
    });
    errorRate.add(!isSuccess);
  }

  sleep(0.4);
}