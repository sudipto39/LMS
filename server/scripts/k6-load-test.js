import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

/**
 * ============================================================================
 * GiteaForge / LMS Express Backend - Grafana k6 Multi-Stage Load & Stress Test
 * ============================================================================
 * Usage:
 *   npm run test:k6
 *   node scripts/run-k6.js
 *   node scripts/run-k6.js -e TARGET_URL=https://lms-backend-xyz.a.run.app
 * ============================================================================
 */

export const errorRate = new Rate("errors");

const TARGET_URL = (__ENV.TARGET_URL || "http://localhost:5000").replace(/\/$/, "");

export const options = {
  // Automated Quality Gates (Thresholds)
  thresholds: {
    // 95% of requests must complete below 300ms; 99% below 600ms
    http_req_duration: ["p(95)<300", "p(99)<600"],
    // Error rate must remain strictly below 1% under load
    errors: ["rate<0.01"],
    http_req_failed: ["rate<0.01"],
  },

  // Multi-Stage Traffic Simulation
  stages: [
    { duration: "10s", target: 20 },  // Stage 1: Warmup & ramp up to 20 users
    { duration: "20s", target: 100 }, // Stage 2: Normal peak traffic (100 users)
    { duration: "15s", target: 250 }, // Stage 3: Sudden submission spike (250 users)
    { duration: "10s", target: 0 },   // Stage 4: Ramp down / system recovery
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

  sleep(0.3);

  // 2. API Root Info Request
  {
    const res = http.get(`${TARGET_URL}/`);
    const isSuccess = check(res, {
      "root status is 200": (r) => r.status === 200,
    });
    errorRate.add(!isSuccess);
  }

  sleep(0.3);

  // 3. Security Guard Check (401 is expected and valid)
  {
    const res = http.get(`${TARGET_URL}/api/v1/admin/stats`, {
      responseCallback: http.expectedStatuses(401),
    });
    const isSuccess = check(res, {
      "unauthorized admin request blocked with 401": (r) => r.status === 401,
    });
    errorRate.add(!isSuccess);
  }

  sleep(0.5);
}