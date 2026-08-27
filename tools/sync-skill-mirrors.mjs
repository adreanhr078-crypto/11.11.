#!/usr/bin/env node
/**
 * tools/sync-skill-mirrors.mjs
 *
 * Wave 4.1: Drift detector for the .kilo/skills/* mirror pointers.
 *
 * The 11.11 environment has a canonical-mirror pattern for skills:
 *   - .agents/skills/<name>/SKILL.md   (canonical, full content)
 *   - .kilo/skills/<name>/SKILL.md     (mirror, short pointer)
 *
 * This script checks that every mirror:
 *   1. Exists
 *   2. Has the same `name` and `description` in YAML frontmatter
 *   3. Body says it is a mirror of the canonical
 *   4. Canonical exists
 *
 * Exit code:
 *   0 = no drift
 *   1 = drift detected (printed to stderr)
 *   2 = script error
 *
 * Usage:
 *   node tools/sync-skill-mirrors.mjs
 *   node tools/sync-skill-mirrors.mjs --json
 *
 * Does NOT auto-fix. Drift is reported so the owner can decide.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// repo root is the parent of the tools/ directory
const REPO_ROOT = join(__dirname, "..");
const CANONICAL_DIR = join(REPO_ROOT, ".agents", "skills");
const MIRROR_DIR = join(REPO_ROOT, ".kilo", "skills");

const ARGS = process.argv.slice(2);
const JSON_MODE = ARGS.includes("--json");

/**
 * Parse a minimal YAML frontmatter block (name, description).
 * Returns null if no frontmatter found.
 */
function parseFrontmatter(content) {
  if (!content.startsWith("---")) return null;
  const end = content.indexOf("\n---", 3);
  if (end < 0) return null;
  const block = content.slice(3, end);
  const out = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (m) {
      out[m[1]] = m[2].trim();
    }
  }
  return out;
}

function readFrontmatter(path) {
  if (!existsSync(path)) return null;
  return parseFrontmatter(readFileSync(path, "utf8"));
}

function isMirrorBody(content) {
  return /Mirror of `\.agents\/skills\//.test(content) ||
         /\(mirror\)/i.test(content) ||
         /this mirror keeps the skill available/i.test(content);
}

function listSkills(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function checkOne(name) {
  const canonicalPath = join(CANONICAL_DIR, name, "SKILL.md");
  const mirrorPath = join(MIRROR_DIR, name, "SKILL.md");

  const issues = [];

  if (!existsSync(canonicalPath)) {
    issues.push("canonical missing");
  }
  if (!existsSync(mirrorPath)) {
    issues.push("mirror missing");
    return { name, status: "missing-mirror", issues };
  }

  const cFront = readFrontmatter(canonicalPath);
  const mFront = readFrontmatter(mirrorPath);

  if (!cFront) issues.push("canonical frontmatter unreadable");
  if (!mFront) issues.push("mirror frontmatter unreadable");

  if (cFront && mFront) {
    if (cFront.name !== mFront.name) {
      issues.push(`name mismatch: canonical='${cFront.name}' mirror='${mFront.name}'`);
    }
    if (cFront.description !== mFront.description) {
      issues.push("description mismatch");
    }
  }

  const mirrorContent = readFileSync(mirrorPath, "utf8");
  if (!isMirrorBody(mirrorContent)) {
    issues.push("body does not look like a mirror (no 'Mirror of' marker)");
  }

  return {
    name,
    status: issues.length === 0 ? "ok" : "drift",
    issues,
  };
}

function main() {
  const canonical = listSkills(CANONICAL_DIR);
  const mirror = listSkills(MIRROR_DIR);
  const all = new Set([...canonical, ...mirror]);

  const results = [];
  for (const name of [...all].sort()) {
    results.push(checkOne(name));
  }

  const drift = results.filter((r) => r.status !== "ok");
  const ok = results.filter((r) => r.status === "ok");

  if (JSON_MODE) {
    const json = {
      scannedAt: new Date().toISOString(),
      canonicalDir: CANONICAL_DIR,
      mirrorDir: MIRROR_DIR,
      total: results.length,
      ok: ok.length,
      drift: drift.length,
      results,
    };
    process.stdout.write(JSON.stringify(json, null, 2) + "\n");
    process.exit(drift.length === 0 ? 0 : 1);
  }

  // human-readable
  process.stdout.write(`Skill mirror sync check\n`);
  process.stdout.write(`  canonical: ${CANONICAL_DIR}\n`);
  process.stdout.write(`  mirror:    ${MIRROR_DIR}\n`);
  process.stdout.write(`  total:     ${results.length}\n`);
  process.stdout.write(`  ok:        ${ok.length}\n`);
  process.stdout.write(`  drift:     ${drift.length}\n\n`);

  if (drift.length === 0) {
    process.stdout.write("OK: no drift detected.\n");
    process.exit(0);
  }

  process.stderr.write("DRIFT DETECTED:\n");
  for (const r of drift) {
    process.stderr.write(`  - ${r.name}: ${r.issues.join("; ")}\n`);
  }
  process.stderr.write(
    "\nFix by updating the mirror in .kilo/skills/<name>/SKILL.md to point " +
      "to the current canonical content in .agents/skills/<name>/SKILL.md.\n"
  );
  process.exit(1);
}

try {
  main();
} catch (e) {
  if (JSON_MODE) {
    process.stdout.write(JSON.stringify({ error: String(e) }) + "\n");
  } else {
    process.stderr.write(`sync-skill-mirrors: error: ${e.message}\n`);
  }
  process.exit(2);
}
