// FILE: scripts/benchmark.ts
import axios from "axios";
import { setInterval, clearInterval } from "timers";

const API_URL = "http://localhost:3000";
const TOTAL_JOBS = 10; // Adjust based on your machine (start small)
const POLL_INTERVAL = 1000;

// Using httpbin.org to avoid getting banned during testing
// It simulates a real HTML page response
const TARGET_URL = "https://httpbin.org/html";

async function runBenchmark() {
  console.log(`🚀 Starting Benchmark: ${TOTAL_JOBS} jobs...`);

  const jobIds: string[] = [];
  const startTime = Date.now();

  // 1. Queue Jobs
  console.log("-> Queuing jobs...");
  const queueStart = Date.now();

  for (let i = 0; i < TOTAL_JOBS; i++) {
    try {
      // Append query param to make URL unique (bypassing Redis cache for the test)
      const uniqueUrl = `${TARGET_URL}?test_id=${i}&ts=${Date.now()}`;

      const res = await axios.post(`${API_URL}/scrape`, {
        url: uniqueUrl,
        type: "example",
      });
      jobIds.push(res.data.jobId);
    } catch (e: any) {
      console.error("Failed to queue:", e.message);
    }
  }

  const queueTime = Date.now() - queueStart;
  console.log(`-> Queued ${jobIds.length} jobs in ${queueTime}ms`);

  // 2. Poll for Completion
  let completed = 0;
  const checkInterval = setInterval(async () => {
    let pending = 0;
    let finished = 0;

    // Check status of all jobs
    const statusPromises = jobIds.map((id) =>
      axios.get(`${API_URL}/job/${id}`)
    );
    const results = await Promise.all(statusPromises);

    results.forEach((r) => {
      if (r.data.state === "completed" || r.data.state === "failed") {
        finished++;
      } else {
        pending++;
      }
    });

    process.stdout.write(`\rStatus: ${finished}/${TOTAL_JOBS} finished...`);

    if (finished === TOTAL_JOBS) {
      clearInterval(checkInterval);
      finish(startTime);
    }
  }, POLL_INTERVAL);
}

function finish(startTime: number) {
  const totalTime = Date.now() - startTime;
  const seconds = totalTime / 1000;

  console.log("\n\n--- BENCHMARK RESULTS ---");
  console.log(`Total Time:   ${seconds.toFixed(2)}s`);
  console.log(`Throughput:   ${(TOTAL_JOBS / seconds).toFixed(2)} jobs/sec`);
  console.log(
    `Throughput:   ${((TOTAL_JOBS / seconds) * 60).toFixed(0)} jobs/min`
  );
  console.log(`Avg Time/Job: ${(totalTime / TOTAL_JOBS).toFixed(0)}ms`);
  console.log("-------------------------");
}

runBenchmark();
