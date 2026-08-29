/**
 * Safe headless Unity entry point for isolated 11.11 technical proofs.
 *
 * This wrapper never installs Unity, accepts credentials, or changes PATH.
 * Resolve Unity from UNITY_EXE, PATH, a custom C:\\Tools folder, or Unity Hub.
 *
 * Examples:
 *   npx tsx tools/unity/run-unity.ts -- doctor
 *   npx tsx tools/unity/run-unity.ts -- -projectPath ./Unity11 -executeMethod ExportPipeline.ExportAll
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  readConfiguredPath,
  resolveUnityExecutable,
} from "../environment-setup/tool-resolution";

const DEFAULT_TIMEOUT_MS = 30 * 60_000;
const DOCTOR_TIMEOUT_MS = 60_000;
const MAX_TIMEOUT_MS = 4 * 60 * 60_000;

export function parseUnityTimeout(
  value = process.env.UNITY_TIMEOUT_MS,
): number {
  if (!value) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(value);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 1_000 ||
    parsed > MAX_TIMEOUT_MS
  ) {
    throw new Error(
      `UNITY_TIMEOUT_MS must be an integer from 1000 to ${MAX_TIMEOUT_MS}.`,
    );
  }
  return parsed;
}

function includesFlag(args: string[], flag: string): boolean {
  return args.some((arg) => arg.toLowerCase() === flag.toLowerCase());
}

export function buildUnityArgs(args: string[]): string[] {
  const prepared = [...args];
  if (!includesFlag(prepared, "-batchmode")) prepared.unshift("-batchmode");
  if (!includesFlag(prepared, "-logFile")) prepared.push("-logFile", "-");
  if (!includesFlag(prepared, "-runTests") && !includesFlag(prepared, "-quit"))
    prepared.push("-quit");
  return prepared;
}

export function requireUnityExecutable(): string {
  const configured = readConfiguredPath("UNITY_EXE");
  if (configured && !existsSync(configured)) {
    throw new Error(`UNITY_EXE does not exist: ${configured}`);
  }
  const executable = resolveUnityExecutable();
  if (!executable) {
    throw new Error(
      "Unity Editor is not available. Windows has no supported portable Unity Editor; install the pinned LTS build, then set UNITY_EXE.",
    );
  }
  return executable;
}

type UnityResult = { code: number; timedOut: boolean };

function runUnity(
  executable: string,
  args: string[],
  timeoutMs: number,
): Promise<UnityResult> {
  return new Promise((settle) => {
    const child = spawn(executable, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      windowsHide: true,
    });
    let settled = false;
    const finish = (code: number, timedOut: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      settle({ code, timedOut });
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(124, true);
    }, timeoutMs);
    child.stdout.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    child.on("error", (error) => {
      process.stderr.write(`Unity failed to start: ${error.message}\n`);
      finish(1, false);
    });
    child.on("close", (code) => finish(code ?? 1, false));
  });
}

export async function main(): Promise<number> {
  const raw = process.argv.slice(2);
  if (raw.length === 0 || raw[0] !== "--") {
    console.error("Usage: run-unity.ts -- doctor | <unity-args>");
    return 2;
  }

  const requested = raw.slice(1);
  if (requested.length === 0) {
    console.error(
      "Unity arguments are required. Use `-- doctor` to inspect availability.",
    );
    return 2;
  }

  let executable: string;
  try {
    executable = requireUnityExecutable();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }

  const doctor = requested.length === 1 && requested[0] === "doctor";
  let timeoutMs: number;
  try {
    timeoutMs = doctor ? DOCTOR_TIMEOUT_MS : parseUnityTimeout();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }

  const args = doctor
    ? ["-batchmode", "-quit", "-version", "-logFile", "-"]
    : buildUnityArgs(requested);
  console.log(`UNITY_EXE=${executable}`);
  const result = await runUnity(executable, args, timeoutMs);
  if (result.timedOut) console.error(`Unity timed out after ${timeoutMs}ms.`);
  return result.code;
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
