#!/usr/bin/env node

/**
 * pnpm-only enforcement script
 * Prevents accidental npm/yarn usage in this repository
 */

// Fail early if not using pnpm
const ua = process.env.npm_config_user_agent || "";
const isPNPM = /\bpnpm\/\d/.test(ua);

if (!isPNPM) {
    console.error(`
⛔ This repository is pnpm-only.

Detected package manager: ${ua || 'unknown'}

Please use pnpm instead:
  pnpm install
  pnpm add <package>
  pnpm run <script>

For more info: https://pnpm.io/
`);
    process.exit(1);
}

// Optional: Verify Node version compatibility
const requiredNode = ">=18.18.0";
const currentVersion = process.version;
const semver = (v) => v.replace(/^v/, "").split(".").map(Number);
const [maj, min, patch] = semver(currentVersion);
const [reqMaj, reqMin, reqPatch] = semver(requiredNode);

if (maj < reqMaj || (maj === reqMaj && min < reqMin) || (maj === reqMaj && min === reqMin && patch < reqPatch)) {
    console.error(`
⚠️  Node ${requiredNode} recommended for this project.
   Current: ${currentVersion}
   
   This may cause compatibility issues.
`);
}

// Success - pnpm detected
console.log(`✅ Using pnpm (detected from: ${ua})`);
