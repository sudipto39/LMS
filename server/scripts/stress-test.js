#!/usr/bin/env node

/**
 * ============================================================================
 * GiteaForge / LMS Express Backend — Autocannon Stress & Load Benchmarking
 * ============================================================================
 * Usage:
 *   npm run test:stress
 *   node scripts/stress-test.js [target_url]
 *
 * Examples:
 *   node scripts/stress-test.js http://localhost:5000
 *   node scripts/stress-test.js https://lms-backend-xyz.a.run.app
 * ============================================================================
 */

import autocannon from "autocannon";

const targetUrl = (process.argv[2] || process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");

console.log("\n" + "=".repeat(70));
console.log(`?? STARTING AUTOCANNON STRESS BENCHMARK`);
console.log(`?? Target URL: ${targetUrl}`);
console.log("=".repeat(70) + "\n");

async function runScenario(title, options) {
  console.log(`? Running Scenario: ${title}`);
  console.log(`  • Connections: ${options.connections}`);
  console.log(`  • Duration: ${options.duration}s`);
  console.log(`  • Endpoint: ${options.url}`);

  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        ...options,
        title,
      },
      (err, result) => {
        if (err) {
          console.error(`  ? Error executing ${title}:`, err);
          return reject(err);
        }

        console.log("\n?? Results:");
        console.log(`  • Total Requests : ${result.requests.total}`);
        console.log(`  • Avg Req/Sec    : ${result.requests.average.toFixed(1)} req/s`);
        console.log(`  • Avg Latency    : ${result.latency.average.toFixed(2)} ms`);
        console.log(`  • P50 Latency    : ${result.latency.p50} ms`);
        console.log(`  • P90 Latency    : ${result.latency.p90} ms`);
        console.log(`  • P99 Latency    : ${result.latency.p99} ms`);
        console.log(`  • 1xx / 2xx / 3xx: ${result["1xx"] + result["2xx"] + result["3xx"]}`);
        console.log(`  • 4xx (Client Err): ${result["4xx"]}`);
        console.log(`  • 5xx (Server Err): ${result["5xx"]}`);
        console.log(`  • Total Errors   : ${result.errors}`);
        console.log(`  • Total Timeouts : ${result.timeouts}`);
        console.log("-".repeat(70) + "\n");
        resolve(result);
      }
    );

    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function runAllBenchmarks() {
  try {
    // Quick connectivity check
    const check = await fetch(`${targetUrl}/health`).catch((err) => {
      console.error(`\n? Target server is not reachable at ${targetUrl}/health!`);
      console.error(`Please ensure your backend server is running (npm run dev or npm start).\n`);
      process.exit(1);
    });

    if (!check.ok) {
      console.error(`? Health check failed with HTTP ${check.status}`);
      process.exit(1);
    }

    console.log(`? Server is online and healthy. Beginning load stages...\n`);

    // Stage 1: Warmup / Normal Peak Traffic (50 concurrent users)
    await runScenario("Stage 1: Normal Peak Traffic (50 Concurrency)", {
      url: `${targetUrl}/health`,
      connections: 50,
      duration: 10,
    });

    // Stage 2: High Concurrency Load (100 concurrent users)
    await runScenario("Stage 2: High Load Simulation (100 Concurrency)", {
      url: `${targetUrl}/`,
      connections: 100,
      duration: 10,
    });

    // Stage 3: Spike / Stress Surge (250 concurrent users)
    await runScenario("Stage 3: Sudden Traffic Spike (250 Concurrency)", {
      url: `${targetUrl}/health`,
      connections: 250,
      duration: 10,
    });

    console.log("=".repeat(70));
    console.log("?? ALL STRESS BENCHMARK SCENARIOS COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(70) + "\n");
    process.exit(0);
  } catch (error) {
    console.error("?? Stress benchmark failed:", error);
    process.exit(1);
  }
}

runAllBenchmarks();
