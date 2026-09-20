async function test() {
  const judge0Url = process.env.JUDGE0_URL || "http://localhost:2358";
  console.log(`Testing Judge0 code execution at ${judge0Url}...`);
  const res = await fetch(`${judge0Url}/submissions?wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_code: "print('Hello from Judge0 Python 3!')",
      language_id: 71, // Python 3.8.1
    }),
  });
  const data = await res.json();
  console.log("Judge0 Status:", data.status?.description);
  console.log("Judge0 Stdout:", data.stdout);
  console.log("Execution Time:", data.time, "seconds");
}
test();
