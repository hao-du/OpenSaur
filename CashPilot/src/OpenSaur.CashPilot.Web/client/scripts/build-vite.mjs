import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viteBin = path.resolve(__dirname, "../node_modules/vite/bin/vite.js");

const args = process.argv.slice(2);
const offlineModeIndex = args.indexOf("--offline-mode");
const isOfflineMode = offlineModeIndex >= 0;

if (isOfflineMode) {
  args.splice(offlineModeIndex, 1);
}

const result = spawnSync(process.execPath, [viteBin, "build", ...args], {
  env: {
    ...process.env,
    ...(isOfflineMode ? { VITE_CASHPILOT_APP_MODE: "offline" } : {})
  },
  stdio: "inherit"
});

process.exit(result.status ?? 1);
