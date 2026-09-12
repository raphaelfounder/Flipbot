import { spawnSync } from "node:child_process";
import path from "node:path";

const detector = "C:\\Users\\raffi\\.codex\\plugins\\cache\\impeccable\\impeccable\\4.3.1\\skills\\impeccable\\scripts\\impeccable.cmd";
const targets = [
  "src/app/legal/[policy]/page.tsx",
  "src/components/auth/sign-up-form.tsx",
  "src/components/flipbot-dashboard.tsx",
];
const result = spawnSync(detector, ["detect", "--json", ...targets], {
  cwd: process.cwd(),
  encoding: "utf8",
  shell: true,
  env: { ...process.env, IMPECCABLE_HOME: path.join(process.cwd(), ".impeccable", "cache") },
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("UNLAZY_OK_IMPECCABLE");
