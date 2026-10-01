#!/usr/bin/env node

/**
 * ============================================================================
 * GiteaForge / LMS Express Backend — Realistic Multi-Tier Student Journey Load Test
 * ============================================================================
 * Usage:
 *   npm run test:realistic
 *   node scripts/lms-realistic-load-test.js [target_url] [concurrent_students]
 *
 * Simulates a realistic university campus workload:
 *   - 35% Portal Root & Status Probe (/ & /health)
 *   - 25% CSRF Token Session Handshake (/api/v1/auth/csrf)
 *   - 20% API Documentation & Catalog (/api-docs/)
 *   - 10% Problem Statement Discovery (/api/v1/problem-statements)
 *   - 10% Protected Endpoint Security Checks (/api/v1/admin/stats -> 401)
 * ============================================================================
 */

import autocannon from "autocannon";

const targetUrl = (process.argv[2] || process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
const targetStudents = Number(process.env.VIRTUAL_STUDENTS || process.argv[3] || 1000);

console.log("\n" + "=".repeat(78));
console.log("🎓 GITEAFORGE LMS — REALISTIC MULTI-TIER CAMPUS WORKLOAD TEST");
console.log(`🎯 Target URL        : ${targetUrl}`);
console.log(`👥 Virtual Students  : ${targetStudents.toLocaleString()} concurrent users`);
console.log("=".repeat(78) + "\n");

async function runRealisticWorkload() {
  // Connectivity check
  const check = await fetch(`${targetUrl}/health`).catch(() => {
    console.error(`\n❌ Target server is not reachable at ${targetUrl}/health!`);
    console.error("Please ensure your backend server is running.\n");
    process.exit(1);
  });

  if (!check.ok) {
    console.error(`❌ Health check probe failed with status ${check.status}`);
    process.exit(1);
  }

  console.log("✅ Target server is online. Commencing realistic multi-endpoint workload simulation...\n");

  const requests = [
    // 35% Portal Root & System Probe
    { method: "GET", path: "/health", weight: 20 },
    { method: "GET", path: "/", weight: 15 },

    // 25% Session initialization & CSRF token issuance
    { method: "GET", path: "/api/v1/auth/csrf", weight: 25 },

    // 20% API Spec & Documentation
    { method: "GET", path: "/api-docs/", weight: 20 },

    // 10% Public problem statements / assignment catalog
    { method: "GET", path: "/api/v1/problem-statements", weight: 10 },

    // 10% Protected route authentication enforcement
    {
      method: "GET",
      path: "/api/v1/admin/stats",
      weight: 10,
    },
  ];

  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: targetUrl,
        connections: targetStudents,
        duration: 25,
        pipelining: 1,
        timeout: 10,
        requests,
        title: "Realistic LMS Student Journey Load",
      },
      (err, result) => {
        if (err) {
          console.error("❌ Workload execution failed:", err);
          return reject(err);
        }

        console.log("\n" + "=".repeat(78));
        console.log("📊 REALISTIC LMS BENCHMARK RESULTS");
        console.log("=".repeat(78));
        console.log(`• Virtual Active Students   : ${targetStudents.toLocaleString()}`);
        console.log(`• Total Requests Served     : ${result.requests.total.toLocaleString()}`);
        console.log(`• Sustained Throughput      : ${result.requests.average.toFixed(1)} req/s`);
        console.log(`• Mean Response Latency     : ${result.latency.average.toFixed(2)} ms`);
        console.log(`• Median Latency (P50)      : ${result.latency.p50} ms`);
        console.log(`• 90th Percentile (P90)     : ${result.latency.p90} ms`);
        console.log(`• 99th Percentile (P99)     : ${result.latency.p99} ms`);
        console.log(`• 2xx / 3xx Successes       : ${result["1xx"] + result["2xx"] + result["3xx"]}`);
        console.log(`• 4xx (Expected Auth Guards): ${result["4xx"]}`);
        console.log(`• 5xx (Server Faults)       : ${result["5xx"]}`);
        console.log(`• Dropped / Timeouts        : ${result.timeouts}`);
        console.log("-".repeat(78));

        // Academic capacity estimation
        const rps = result.requests.average;
        const estimatedRegisteredCampus = Math.round(rps * 15); // based on 15s avg think-time per active student
        console.log("🏫 CAMPUS SIZING PROJECTION:");
        console.log(`  At ${rps.toFixed(0)} requests/second sustained with ${result.latency.average.toFixed(0)}ms latency,`);
        console.log(`  this LMS configuration can comfortably serve an enrolled student body of`);
        console.log(`  ~${estimatedRegisteredCampus.toLocaleString()} students with typical ~5–15s think-time.`);
        console.log("=".repeat(78) + "\n");
        resolve(result);
      }
    );

    autocannon.track(instance, { renderProgressBar: true });
  });
}

runRealisticWorkload().catch(() => process.exit(1));
