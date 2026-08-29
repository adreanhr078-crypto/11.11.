/**
 * Safe Godot entry point for isolated, non-Canon 11.11 technical proofs.
 *
 * This wrapper never installs an engine, downloads export templates, modifies
 * PATH, or accepts arbitrary game projects. Only doctor and the repository's
 * bounded technical smoke proof are allowed while Godot remains deferred.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  readConfiguredPath,
  resolveGodotExecutable,
} from "../environment-setup/tool-resolution";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TECHNICAL_PROOF_ROOT = resolve(
  REPO_ROOT,
  "artifacts",
  "eleven-eleven",
  "art",
  "godot",
  "technical-proofs",
);
const DEFAULT_PROOF = resolve(TECHNICAL_PROOF_ROOT, "engine-smoke");
const LOG_ROOT = resolve(
  REPO_ROOT,
  "artifacts",
  "eleven-eleven",
  ".tmp",
  "godot-smoke",
);
const DEFAULT_TIMEOUT_MS = 2 * 60_000;
const MAX_TIMEOUT_MS = 10 * 60_000;
const PINNED_VERSION = /^4\.7\.2\.stable\.official(?:\.|$)/;

export function parseGodotTimeout(
  value = process.env.GODOT_TIMEOUT_MS,
): number {
  if (!value) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(value);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 1_000 ||
    parsed > MAX_TIMEOUT_MS
  ) {
    throw new Error(
      `GODOT_TIMEOUT_MS must be an integer from 1000 to ${MAX_TIMEOUT_MS}.`,
    );
  }
  return parsed;
}

export function matchesPinnedGodotVersion(version: string): boolean {
  return PINNED_VERSION.test(version.trim());
}

export function resolveTechnicalProofPath(requested = DEFAULT_PROOF): string {
  const proof = resolve(requested);
  const proofRelative = relative(TECHNICAL_PROOF_ROOT, proof);
  if (proofRelative.startsWith("..") || isAbsolute(proofRelative)) {
    throw new Error(`Godot proof must stay inside ${TECHNICAL_PROOF_ROOT}.`);
  }
  if (!existsSync(join(proof, "project.godot"))) {
    throw new Error(`Godot technical proof is missing project.godot: ${proof}`);
  }
  return proof;
}

function consoleSibling(candidate: string): string {
  if (process.platform !== "win32" || /_console\.exe$/i.test(candidate))
    return candidate;
  const sibling = candidate.replace(/\.exe$/i, "_console.exe");
  return existsSync(sibling) ? sibling : candidate;
}

export function requireGodotExecutable(): string {
  const configured = readConfiguredPath("GODOT_EXE");
  if (configured && !existsSync(configured)) {
    throw new Error(`GODOT_EXE does not exist: ${configured}`);
  }
  const executable = resolveGodotExecutable();
  if (!executable) {
    throw new Error(
      "Godot is not available. Extract the pinned Standard ZIP to C:\\Tools\\Godot-4.7.2-stable or set GODOT_EXE.",
    );
  }
  return consoleSibling(executable);
}

type GodotResult = {
  code: number;
  output: string;
  timedOut: boolean;
};

function runGodot(
  executable: string,
  args: string[],
  timeoutMs: number,
): Promise<GodotResult> {
  return new Promise((settle) => {
    const child = spawn(executable, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      windowsHide: true,
    });
    const chunks: string[] = [];
    let settled = false;
    const append = (chunk: unknown) => {
      const text = String(chunk);
      chunks.push(text);
      process.stdout.write(text);
    };
    const finish = (code: number, timedOut: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      settle({ code, output: chunks.join(""), timedOut });
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(124, true);
    }, timeoutMs);
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", (error) => {
      append(`Godot failed to start: ${error.message}\n`);
      finish(1, false);
    });
    child.on("close", (code) => finish(code ?? 1, false));
  });
}

async function doctor(executable: string): Promise<number> {
  const marker = join(dirname(executable), "_sc_");
  if (!existsSync(marker)) {
    console.error(`Portable self-contained marker is missing: ${marker}`);
    return 2;
  }
  const result = await runGodot(executable, ["--version"], 30_000);
  if (result.code !== 0 || !matchesPinnedGodotVersion(result.output)) {
    console.error(
      `Expected pinned Godot 4.7.2 Standard; received: ${result.output.trim() || "no version output"}`,
    );
    return 2;
  }
  console.log("GODOT_DOCTOR_OK");
  return 0;
}

async function smoke(
  executable: string,
  proof: string,
  timeoutMs: number,
): Promise<number> {
  mkdirSync(LOG_ROOT, { recursive: true });
  const importResult = await runGodot(
    executable,
    ["--headless", "--path", proof, "--import"],
    timeoutMs,
  );
  writeFileSync(join(LOG_ROOT, "import.log"), importResult.output, "utf8");
  if (importResult.timedOut || importResult.code !== 0) {
    console.error(
      importResult.timedOut
        ? "Godot import timed out."
        : "Godot import failed.",
    );
    return importResult.code || 1;
  }

  const runResult = await runGodot(
    executable,
    ["--headless", "--path", proof],
    timeoutMs,
  );
  writeFileSync(join(LOG_ROOT, "run.log"), runResult.output, "utf8");
  if (
    runResult.timedOut ||
    runResult.code !== 0 ||
    !runResult.output.includes("GODOT_SMOKE_OK")
  ) {
    console.error(
      runResult.timedOut
        ? "Godot smoke timed out."
        : "Godot smoke marker was not produced.",
    );
    return runResult.code || 1;
  }
  console.log("GODOT_PORTABLE_PROOF_OK");
  return 0;
}

export async function main(): Promise<number> {
  const raw = process.argv.slice(2);
  if (raw.length === 0 || raw[0] !== "--") {
    console.error(
      "Usage: run-godot.ts -- doctor | smoke [technical-proof-path]",
    );
    return 2;
  }
  const [command, proofArgument, ...extra] = raw.slice(1);
  if (!command || extra.length > 0 || !["doctor", "smoke"].includes(command)) {
    console.error(
      "Only `doctor` and `smoke [technical-proof-path]` are allowed.",
    );
    return 2;
  }
  if (command === "doctor" && proofArgument) {
    console.error("`doctor` does not accept a project path.");
    return 2;
  }

  let executable: string;
  try {
    executable = requireGodotExecutable();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
  console.log(`GODOT_EXE=${executable}`);

  if (command === "doctor") return doctor(executable);

  try {
    const proof = resolveTechnicalProofPath(proofArgument);
    const timeoutMs = parseGodotTimeout();
    const doctorCode = await doctor(executable);
    if (doctorCode !== 0) return doctorCode;
    return smoke(executable, proof, timeoutMs);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  void main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(
        error instanceof Error ? (error.stack ?? error.message) : String(error),
      );
      process.exitCode = 1;
    });
}
