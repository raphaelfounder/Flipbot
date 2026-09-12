import { spawnSync } from "node:child_process";
const result = spawnSync("pnpm", ["lint"], { stdio: "inherit", shell: true });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("UNLAZY_OK_G2");
