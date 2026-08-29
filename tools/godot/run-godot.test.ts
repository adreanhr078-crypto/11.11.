import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";

import {
  matchesPinnedGodotVersion,
  parseGodotTimeout,
  resolveTechnicalProofPath,
} from "./run-godot";

test("accepts only the pinned official Godot version family", () => {
  assert.equal(
    matchesPinnedGodotVersion("4.7.2.stable.official.ed1daf0bf"),
    true,
  );
  assert.equal(
    matchesPinnedGodotVersion("4.7.1.stable.official.deadbeef"),
    false,
  );
  assert.equal(
    matchesPinnedGodotVersion("4.7.2.stable.mono.official.ed1daf0bf"),
    false,
  );
});

test("keeps Godot timeouts bounded", () => {
  assert.equal(parseGodotTimeout("1000"), 1000);
  assert.throws(() => parseGodotTimeout("0"), /GODOT_TIMEOUT_MS/);
  assert.throws(() => parseGodotTimeout("not-a-number"), /GODOT_TIMEOUT_MS/);
  assert.throws(
    () => parseGodotTimeout(String(10 * 60_000 + 1)),
    /GODOT_TIMEOUT_MS/,
  );
});

test("allows the tracked smoke proof and rejects arbitrary projects", () => {
  const proof = resolveTechnicalProofPath();
  assert.match(proof, /art[\\/]godot[\\/]technical-proofs[\\/]engine-smoke$/);
  assert.throws(
    () => resolveTechnicalProofPath(resolve("artifacts", "eleven-eleven")),
    /must stay inside/,
  );
});
