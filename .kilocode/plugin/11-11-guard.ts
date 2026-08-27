/**
 * .kilocode/plugin/11-11-guard.ts
 *
 * Kilo plugin for the 11.11 project. Wave 3 enhanced, Wave 4.1 refactored,
 * Wave 4.2-lite command hints extended.
 *
 * Provides:
 * - tool.execute.before / after hooks for quality gate enforcement
 * - command.execute.before hook for command instrumentation
 * - event hook for session/file/permission tracking
 * - shell.env to inject project environment variables
 *
 * Wave 3 additions:
 * - Persistent PRE_CHANGE_AUDIT_LOG written to disk
 * - validatePreChange() hook for preflight before any edit
 * - validatePostChange() hook for postflight after any edit
 * - Expanded SECRET_PATTERNS for in-diff secret detection (advisory)
 * - Canon violation detection in pre-tool hook (advisory)
 * - Hint messages (advisory) instead of throws for non-frozen violations
 *
 * Wave 4.1 refactor:
 * - Pre-change hints are now passed through a callID-keyed buffer
 *   (PENDING_HINTS) and attached to output.metadata.guard.preChangeHints
 *   in the matching `tool.execute.after` hook, instead of being
 *   injected into output.args. The previous approach risked the tool
 *   receiving an unexpected extra argument.
 * - Buffer entries are GC'd after 5 minutes to bound memory.
 *
 * Wave 4.2-lite additions:
 * - Command hints for `/release-check` (pre-release gate, 8 categories).
 * - Command hints for `/playtest` and `/playtest-director`
 *   (non-negotiable player test, 8-dimension score).
 *
 * Backward compatible: every existing behavior is preserved.
 * Drop this file into .kilo/plugin/ or .kilocode/plugin/ and it
 * auto-registers at startup.
 */

import { execSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

type ToolInput = { tool: string; sessionID: string; callID: string };
type ToolBeforeOutput = { args: Record<string, unknown> };
type ToolAfterOutput = { title: string; output: string; metadata: Record<string, unknown> };
type CommandInput = { command: string; sessionID: string; arguments: string };
type CommandOutput = { parts: Array<{ type: string; text?: string }> };
type ShellInput = { cwd: string; sessionID?: string; callID?: string };
type ShellOutput = { env: Record<string, string> };
type EventInput = { event: { type: string; properties?: Record<string, unknown> } };

// ----------------------------------------------------------------------
// Frozen-path patterns: edits here are BLOCKED without owner direction.
// See artifacts/eleven-eleven/AGENT_RULES.md section 6.
// ----------------------------------------------------------------------
const FROZEN_PATTERNS = [
  /artifacts\/eleven-eleven\/src\/puzzles\.ts$/,
  /artifacts\/eleven-eleven\/src\/lore\.ts$/,
  /artifacts\/eleven-eleven\/src\/domain\/cinematics\//,
  /artifacts\/eleven-eleven\/src\/content\/puzzles\//,
  /artifacts\/eleven-eleven\/functions\/api\/player\/_storyPuzzleDefinitions\.ts$/,
  /artifacts\/eleven-eleven\/src\/domain\/live-challenges\/smartLivePuzzleGenerator\.ts$/,
];

// ----------------------------------------------------------------------
// Secret patterns: detected on write/edit; ADVISORY only (warns, does
// not block). The owner can intervene in chat to correct the change.
// Excludes .env, .dev.vars, .gitignore (intentional config surfaces).
// ----------------------------------------------------------------------
const SECRET_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "OpenAI API key", re: /sk-[A-Za-z0-9]{32,}/ },
  { name: "GitHub PAT", re: /ghp_[A-Za-z0-9]{36}/ },
  { name: "GitHub fine-grained PAT", re: /github_pat_[A-Za-z0-9_]{82}/ },
  { name: "Slack token", re: /xox[abpr]-[A-Za-z0-9-]{10,}/ },
  { name: "Stripe live key", re: /sk_live_[A-Za-z0-9]{24,}/ },
  { name: "Google API key", re: /AIza[0-9A-Za-z_-]{35}/ },
];

// ----------------------------------------------------------------------
// Canon patterns: edits to these are ADVISORY only. They touch
// non-frozen paths but risk Canon drift. The agent should pause and
// confirm the change with the owner.
// ----------------------------------------------------------------------
const CANON_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "Memory Shards catalog", re: /memory[_-]?shards?\.(json|ts)$/i },
  { name: "Achievement registry", re: /achievements?\.(json|ts)$/i },
  { name: "Endings manifest", re: /endings?\.(json|ts)$/i },
  { name: "Cinematic scene data", re: /data\/schemas\/cinematic-/i },
  { name: "Story act config", re: /story[_-]?acts?\.(json|ts)$/i },
];

// ----------------------------------------------------------------------
// In-memory audit log (existing behavior) + persistent disk log
// written to .kilo/audit/pre-change.log so the change trail survives
// the session. Wave 3 addition.
// ----------------------------------------------------------------------
const AUDIT_LOG: Array<{ ts: string; tool: string; args: string }> = [];

// Wave 4.1: buffer for pre-change hints keyed by callID. The `before`
// hook writes here, the matching `after` hook attaches them to
// output.metadata.guard.hints. This avoids mutating output.args.
// The buffer is bounded; old entries are GC'd after 5 minutes.
const PENDING_HINTS = new Map<
  string,
  { path: string | undefined; hints: string[]; ts: number }
>();
const HINT_BUFFER_TTL_MS = 5 * 60 * 1000;

function callKey(callID: string): string {
  return callID;
}

function gcPendingHints(): void {
  const cutoff = Date.now() - HINT_BUFFER_TTL_MS;
  for (const [k, v] of PENDING_HINTS) {
    if (v.ts < cutoff) PENDING_HINTS.delete(k);
  }
}

function getAuditLogPath(): string {
  const dir = join(process.cwd(), ".kilo", "audit");
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  } catch {
    // best effort
  }
  return join(dir, "pre-change.log");
}

function appendAuditLog(entry: Record<string, unknown>): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n";
  try {
    appendFileSync(getAuditLogPath(), line, "utf8");
  } catch {
    // best effort — never block the agent on audit-write failure
  }
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
function isFrozenPath(path: string | undefined): boolean {
  if (!path) return false;
  return FROZEN_PATTERNS.some((p) => p.test(path));
}

function detectCanonRisk(path: string | undefined): string | null {
  if (!path) return null;
  for (const { name, re } of CANON_PATTERNS) {
    if (re.test(path)) return name;
  }
  return null;
}

function isWriteTool(tool: string): boolean {
  return ["write", "edit", "apply_patch", "multiedit"].includes(tool);
}

function getEditedPath(args: Record<string, unknown>): string | undefined {
  const a = args as Record<string, unknown>;
  return (a.filePath ?? a.path ?? a.file) as string | undefined;
}

function getEditedContent(args: Record<string, unknown>): string | undefined {
  const a = args as Record<string, unknown>;
  return (a.content ?? a.body ?? a.text) as string | undefined;
}

function detectSecretsInContent(content: string | undefined): string[] {
  if (!content) return [];
  const found: string[] = [];
  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(content)) found.push(name);
  }
  return found;
}

function runQualityGate(): string {
  try {
    const out = execSync("npm run agent:preflight 2>&1 || true", {
      encoding: "utf8",
      timeout: 60_000,
    });
    return out;
  } catch (e) {
    return `preflight failed: ${(e as Error).message}`;
  }
}

// ----------------------------------------------------------------------
// Wave 3: pre-change validation hook. Runs synchronously, returns
// an array of advisory hints. Never throws. The owner sees the
// hints in the next agent message and can correct the change.
// ----------------------------------------------------------------------
function validatePreChange(
  tool: string,
  path: string | undefined,
  content: string | undefined
): string[] {
  const hints: string[] = [];
  if (!isWriteTool(tool)) return hints;

  // Canon risk: warn but do not block
  const canon = detectCanonRisk(path);
  if (canon) {
    hints.push(
      `Canon risk: ${path} matches "${canon}". Verify the change does not introduce contradictions in story fragments, Memory Shards, achievements, endings, or cinematics.`
    );
  }

  // Secret risk: warn but do not block
  const secrets = detectSecretsInContent(content);
  if (secrets.length > 0) {
    hints.push(
      `Secret risk: ${path} contains patterns matching ${secrets.join(", ")}. Verify these are not committed credentials.`
    );
  }

  return hints;
}

// ----------------------------------------------------------------------
// Wave 3: post-change validation hook. Runs asynchronously; emits
// a metadata block the owner can read in the next agent message.
// ----------------------------------------------------------------------
async function validatePostChange(
  tool: string,
  path: string | undefined
): Promise<Record<string, unknown>> {
  const meta: Record<string, unknown> = {
    auditLogSize: AUDIT_LOG.length,
    checkedAt: new Date().toISOString(),
  };
  if (isFrozenPath(path)) {
    meta.frozenPath = path;
  }
  return meta;
}

// ----------------------------------------------------------------------
// Plugin export
// ----------------------------------------------------------------------
export const 11_11_guard = async () => {
  return {
    "tool.execute.before": async (
      input: ToolInput,
      output: ToolBeforeOutput
    ): Promise<void> => {
      if (!isWriteTool(input.tool)) return;

      const path = getEditedPath(output.args);
      const content = getEditedContent(output.args);

      // HARD BLOCK: frozen path
      if (isFrozenPath(path)) {
        appendAuditLog({
          level: "BLOCK",
          tool: input.tool,
          path,
          reason: "frozen_path",
        });
        throw new Error(
          `BLOCKED: ${path} is in a frozen system. ` +
            `See artifacts/eleven-eleven/AGENT_RULES.md section 6 for the list. ` +
            `Request explicit owner direction before modifying.`
        );
      }

      // ADVISORY: pre-change validation.
      // Wave 4.1 refactor: do NOT mutate output.args. Instead, stash hints
      // in a module-level buffer that the matching `tool.execute.after`
      // hook will attach to output.metadata. This avoids the risk of the
      // tool receiving an unexpected extra argument.
      const hints = validatePreChange(input.tool, path, content);
      if (hints.length > 0) {
        appendAuditLog({
          level: "HINT",
          tool: input.tool,
          path,
          hints,
        });
        PENDING_HINTS.set(callKey(input.callID), {
          path,
          hints,
          ts: Date.now(),
        });
      }

      AUDIT_LOG.push({
        ts: new Date().toISOString(),
        tool: input.tool,
        args: path ?? JSON.stringify(output.args).slice(0, 200),
      });
      appendAuditLog({
        level: "INFO",
        tool: input.tool,
        path,
      });
    },

    "tool.execute.after": async (
      input: ToolInput,
      output: ToolAfterOutput
    ): Promise<void> => {
      if (!isWriteTool(input.tool)) return;
      const path = getEditedPath(output.args as Record<string, unknown>);
      if (!path) return;

      const postMeta = await validatePostChange(input.tool, path);

      // Wave 4.1: attach pre-change hints to metadata (not args).
      gcPendingHints();
      const pending = PENDING_HINTS.get(callKey(input.callID));
      const hintsMeta = pending
        ? { path: pending.path, hints: pending.hints }
        : null;
      if (pending) PENDING_HINTS.delete(callKey(input.callID));

      output.metadata = {
        ...output.metadata,
        guard: {
          audit: AUDIT_LOG.length,
          path,
          ts: new Date().toISOString(),
          ...postMeta,
          ...(hintsMeta ? { preChangeHints: hintsMeta } : {}),
        },
      };
    },

    "command.execute.before": async (
      input: CommandInput,
      output: CommandOutput
    ): Promise<void> => {
      if (input.command === "/code" || input.command === "code") {
        const gateOut = runQualityGate();
        output.parts = [
          { type: "text", text: "## preflight\n```\n" + gateOut + "\n```" },
        ];
      } else if (input.command === "/security") {
        output.parts = [
          {
            type: "text",
            text:
              "## security hint\n" +
              "Run `/security npm` first, then `/security secrets`, then `/security canon`. " +
              "Never grant rewards from the client. Server is the authority.",
          },
        ];
      } else if (input.command === "/debug") {
        output.parts = [
          {
            type: "text",
            text:
              "## debug hint\n" +
              "If white-screen: run `/debug white-screen` first. " +
              "Capture the first uncaught exception, the first failing network request, and any stale localStorage keys.",
          },
        ];
      } else if (input.command === "/release-check") {
        output.parts = [
          {
            type: "text",
            text:
              "## release-check hint\n" +
              "All 8 categories must PASS for GO: bugs, performance, assets, localization, accessibility, save integrity, regression, canon. " +
              "Any FAIL = NO-GO. Any UNVERIFIED = HOLD. " +
              "Run `npm run agent:preflight` first, then `npm run build` and `npm run doctor:build` before the full sequence.",
          },
        ];
      } else if (input.command === "/playtest" || input.command === "/playtest-director") {
        output.parts = [
          {
            type: "text",
            text:
              "## playtest hint\n" +
              "Trace the non-negotiable player test: Login -> First contact -> Echo -> clear objective -> Manhwa/Story -> puzzle -> authoritative result -> visual/audio response -> Echo reaction -> next objective -> return reason. " +
              "Score 8 dimensions 0-3. Below 16 = needs attention. Report to `.kilo/reports/playtest/`.",
          },
        ];
      }
    },

    "shell.env": async (
      _input: ShellInput,
      output: ShellOutput
    ): Promise<void> => {
      output.env = {
        ...output.env,
        ELEVEN_ELEVEN_PROJECT: "1",
        NODE_11_11_GUARD: "active",
        NODE_11_11_GUARD_VERSION: "wave3",
      };
    },

    event: async (input: EventInput): Promise<void> => {
      if (input.event.type === "file.edited") {
        const props = input.event.properties ?? {};
        const path = (props.path as string) ?? "";
        if (isFrozenPath(path)) {
          // eslint-disable-next-line no-console
          console.warn(
            `[11.11-guard] WARNING: edited frozen file ${path}. Verify owner approval.`
          );
          appendAuditLog({
            level: "WARN",
            event: "file.edited",
            path,
            reason: "frozen_path_edited_event",
          });
        }
      }
    },
  };
};
