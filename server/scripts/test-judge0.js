async function test() {
  console.log("Testing Judge0 code execution at http://34.93.254.1:2358...");
  const res = await fetch("http://34.93.254.1:2358/submissions?wait=true", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_code: "print('Hello from Judge0 Python 3 on GCP VM!')",
      language_id: 71, // Python 3.8.1
    }),
  });
  const data = await res.json();
  console.log("Judge0 Status:", data.status?.description);
  console.log("Judge0 Stdout:", data.stdout);
  console.log("Execution Time:", data.time, "seconds");
}
test();
