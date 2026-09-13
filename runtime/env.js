import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function loadDotenv(dir = path.dirname(fileURLToPath(import.meta.url))) {
  let raw;
  try {
    raw = fs.readFileSync(path.join(dir, ".env"), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
}
