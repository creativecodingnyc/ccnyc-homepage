import { spawnSync } from "node:child_process";
import path from "node:path";

import { chromium } from "@playwright/test";

const executable = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "lhci.cmd" : "lhci",
);

const result = spawnSync(executable, ["autorun"], {
  env: {
    ...process.env,
    CHROME_PATH: chromium.executablePath(),
  },
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
