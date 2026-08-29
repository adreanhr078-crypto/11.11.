import assert from "node:assert/strict";
import { test } from "node:test";

import { buildUnityArgs, parseUnityTimeout } from "./run-unity";

test("prepares a bounded batch command without a shell-only argument string", () => {
  assert.deepEqual(
    buildUnityArgs([
      "-projectPath",
      "C:/Unity Proof",
      "-executeMethod",
      "Proof.Run",
    ]),
    [
      "-batchmode",
      "-projectPath",
      "C:/Unity Proof",
      "-executeMethod",
      "Proof.Run",
      "-logFile",
      "-",
      "-quit",
    ],
  );
});

test("does not force quit before the Unity test runner owns completion", () => {
  const args = buildUnityArgs([
    "-runTests",
    "-testPlatform",
    "EditMode",
    "-logFile",
    "proof.xml",
  ]);
  assert.equal(args.filter((arg) => arg === "-batchmode").length, 1);
  assert.equal(args.includes("-quit"), false);
  assert.equal(
    args.filter((arg) => arg.toLowerCase() === "-logfile").length,
    1,
  );
});

test("rejects unsafe or unbounded Unity timeout values", () => {
  assert.equal(parseUnityTimeout("1000"), 1000);
  assert.throws(() => parseUnityTimeout("0"), /UNITY_TIMEOUT_MS/);
  assert.throws(() => parseUnityTimeout("not-a-number"), /UNITY_TIMEOUT_MS/);
  assert.throws(
    () => parseUnityTimeout(String(4 * 60 * 60_000 + 1)),
    /UNITY_TIMEOUT_MS/,
  );
});
