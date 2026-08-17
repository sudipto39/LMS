import { spawn } from "child_process";
import fs from "fs";

const k6Binary = fs.existsSync("C:\\Program Files\\k6\\k6.exe")
  ? "C:\\Program Files\\k6\\k6.exe"
  : "k6";

const args = ["run", "scripts/k6-load-test.js", ...process.argv.slice(2)];
const proc = spawn(`"${k6Binary}"`, args, { stdio: "inherit", shell: true });

proc.on("exit", (code) => {
  process.exit(code || 0);
});
