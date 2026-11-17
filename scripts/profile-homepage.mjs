import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

const durationMs = Number(process.env.PROFILE_DURATION_MS || 5 * 60 * 1000);
const baseUrl = process.env.PROFILE_URL || "http://127.0.0.1:4173";
const outputDirectory = path.join(process.cwd(), "artifacts", "performance");

const browser = await chromium.launch();
const page = await browser.newPage({
  reducedMotion: "no-preference",
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const client = await page.context().newCDPSession(page);
await client.send("Performance.enable");

const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

await page.goto(baseUrl, { waitUntil: "networkidle" });
const skip = page.getByRole("button", { name: "Skip" });
if (await skip.isVisible()) await skip.click();

const samples = [];
const startedAt = Date.now();
while (Date.now() - startedAt < durationMs) {
  const { metrics } = await client.send("Performance.getMetrics");
  const values = Object.fromEntries(
    metrics.map(({ name, value }) => [name, value]),
  );
  samples.push({
    elapsedMs: Date.now() - startedAt,
    jsHeapBytes: values.JSHeapUsedSize,
    documents: values.Documents,
    nodes: values.Nodes,
    jsEventListeners: values.JSEventListeners,
    taskDurationSeconds: values.TaskDuration,
  });
  const remainingMs = durationMs - (Date.now() - startedAt);
  if (remainingMs > 0) await page.waitForTimeout(Math.min(10_000, remainingMs));
}

const first = samples[0];
const last = samples.at(-1);
const report = {
  url: baseUrl,
  durationMs: Date.now() - startedAt,
  generatedAt: new Date().toISOString(),
  errors,
  change: {
    jsHeapBytes: last.jsHeapBytes - first.jsHeapBytes,
    documents: last.documents - first.documents,
    nodes: last.nodes - first.nodes,
    jsEventListeners: last.jsEventListeners - first.jsEventListeners,
    taskDurationSeconds: last.taskDurationSeconds - first.taskDurationSeconds,
  },
  summary: {
    taskUtilization:
      (last.taskDurationSeconds - first.taskDurationSeconds) /
      ((last.elapsedMs - first.elapsedMs) / 1000),
    minimumHeapBytes: Math.min(...samples.map((sample) => sample.jsHeapBytes)),
    maximumHeapBytes: Math.max(...samples.map((sample) => sample.jsHeapBytes)),
  },
  samples,
};

await fs.mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, "homepage-profile.json");
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
await browser.close();

console.log(`Wrote ${outputPath}`);
console.log(
  JSON.stringify(
    { errors, change: report.change, summary: report.summary },
    null,
    2,
  ),
);
if (errors.length > 0) process.exitCode = 1;
