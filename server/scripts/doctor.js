#!/usr/bin/env node
// server/scripts/doctor.js
import http from "http";
import https from "https";
import pg from "pg";
import nodemailer from "nodemailer";

const SERVER_HOST = process.env.SERVER_HOST || "localhost";
const GITEA_URL = process.env.GITEA_BASE_URL || `http://${SERVER_HOST}:3000/api/v1`;
const JUDGE0_URL = process.env.JUDGE0_URL || `http://${SERVER_HOST}:2358`;
const DB_URL = process.env.DATABASE_URL || "";

console.log("\n=======================================================");
console.log("🛠️  GiteaForge LMS: Full-Stack Production Diagnostics");
console.log("=======================================================\n");

async function checkUrl(url, label) {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: 3000 }, (res) => {
      console.log(`✅ [${label}] Responded with HTTP status ${res.statusCode} (${url})`);
      resolve(true);
    });
    req.on("error", (err) => {
      console.log(`⚠️  [${label}] Could not connect: ${err.message} (${url})`);
      resolve(false);
    });
    req.on("timeout", () => {
      req.destroy();
      console.log(`⚠️  [${label}] Timeout connecting to ${url}`);
      resolve(false);
    });
  });
}

async function checkDb() {
  if (!DB_URL) {
    console.log(`ℹ️  [PostgreSQL] Check skipped: DATABASE_URL environment variable not configured`);
    return true;
  }
  const pool = new pg.Pool({ connectionString: DB_URL, connectionTimeoutMillis: 3000 });
  try {
    const res = await pool.query("SELECT NOW()");
    console.log(`✅ [PostgreSQL] Connected successfully! Server time: ${res.rows[0].now}`);
    await pool.end();
    return true;
  } catch (err) {
    console.log(`⚠️  [PostgreSQL] Connection check skipped: ${err.message}`);
    await pool.end();
    return false;
  }
}

async function checkSmtp() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.log(`ℹ️  [Nodemailer SMTP] Safe Dev Mode active (OTP codes logged to terminal console)`);
    return true;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    auth: { user, pass },
  });
  try {
    await transporter.verify();
    console.log(`✅ [Nodemailer SMTP] Transporter verified & authenticated for ${user}`);
    return true;
  } catch (err) {
    console.log(`⚠️  [Nodemailer SMTP] Transporter auth check: ${err.message}`);
    return false;
  }
}

async function runDiagnostics() {
  await checkUrl(GITEA_URL.replace("/api/v1", ""), "Gitea Server");
  await checkUrl(`${JUDGE0_URL}/languages`, "Judge0 Sandbox");
  await checkDb();
  await checkSmtp();
  console.log("\n=======================================================");
  console.log("🎉 Diagnostics Complete!");
  console.log("=======================================================\n");
}

runDiagnostics();
