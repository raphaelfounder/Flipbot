import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src/components/flipbot-dashboard.tsx"), "utf8");
const css = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
const mode = process.argv[2];

function requireText(values) {
  for (const value of values) {
    if (!source.includes(value) && !css.includes(value)) throw new Error(`Missing UI evidence: ${value}`);
  }
}

if (mode === "finder") {
  requireText(["SearchState", "ResultsSkeleton", "No deals match these filters", "The finder could not load results", "Page {page} of 3", "Advanced filters"]);
  console.log("UI_OK_FINDER");
} else if (mode === "deals") {
  requireText(["Deal inspection", "Why this could work", "Comparable sold evidence", "SavedStatus", "Next step", "Preview the unlock flow?"]);
  console.log("UI_OK_DEALS");
} else if (mode === "scanner") {
  requireText(["ScanState", "Selected product preview", "Identifying the product", "Likely match", "We could not identify this item", "That is not it"]);
  console.log("UI_OK_SCANNER");
} else if (mode === "account") {
  requireText(["Step {step} of 3", "Credit activity", "No purchase can be made", "Profile & Security", "Help centre", "Reduce motion"]);
  console.log("UI_OK_ACCOUNT");
} else if (mode === "accessibility") {
  requireText(["Skip to workspace", "aria-live=\"polite\"", "aria-modal=\"true\"", "aria-current", "focus-visible", "sm:", "md:", "xl:"]);
  console.log("UI_OK_ACCESSIBILITY");
} else if (mode === "persistence") {
  requireText(["DashboardSnapshot", "window.localStorage.setItem", "readDashboardSnapshot", "onboardingSeen", "updateSettingsAction(next)", "settings={settings}"]);
  console.log("UI_OK_PERSISTENCE");
} else {
  throw new Error("Choose finder, deals, scanner, account, accessibility or persistence");
}
