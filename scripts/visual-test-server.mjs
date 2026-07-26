import { spawn } from "node:child_process";
import path from "node:path";

const port = process.argv[2] ?? "3100";
const nextBin = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next",
);
const child = spawn(
  nextBin,
  ["dev", "--hostname", "127.0.0.1", "--port", port],
  {
    detached: process.platform !== "win32",
    stdio: "inherit",
  },
);

let stopping = false;

function stop(signal) {
  if (stopping) return;
  stopping = true;
  try {
    if (process.platform === "win32") child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch {
    // The server may already have completed its own shutdown.
  }
  setTimeout(() => {
    try {
      if (process.platform === "win32") child.kill("SIGKILL");
      else process.kill(-child.pid, "SIGKILL");
    } catch {
      // The graceful shutdown completed before the fallback was needed.
    }
    process.exit(0);
  }, 2_500).unref();
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => stop(signal));
}

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
