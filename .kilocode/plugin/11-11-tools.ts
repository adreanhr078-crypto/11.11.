/**
 * .kilocode/plugin/11-11-tools.ts
 *
 * Custom tools for the 11.11 project. Each exported tool() becomes
 * callable by the agent.
 *
 * Drop this file into .kilo/plugin/ or .kilocode/plugin/ and it
 * auto-registers at startup.
 */

import { tool } from "@opencode-ai/plugin";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function run(cmd: string, cwd: string = process.cwd()): string {
  try {
    return execSync(cmd, { encoding: "utf8", cwd, stdio: ["pipe", "pipe", "pipe"] });
  } catch (e) {
    return `[error] ${(e as Error).message}`;
  }
}

export const eleven_eleven_tools = async () => ({
  "11_11.preflight": tool({
    description: "Run the 11.11 preflight check from artifacts/eleven-eleven",
    args: {},
    async execute() {
      return run("npm run agent:preflight", join(process.cwd(), "artifacts", "eleven-eleven"));
    },
  }),

  "11_11.postflight": tool({
    description: "Run the 11.11 postflight check from artifacts/eleven-eleven",
    args: {},
    async execute() {
      return run("npm run agent:postflight", join(process.cwd(), "artifacts", "eleven-eleven"));
    },
  }),

  "11_11.media_validate": tool({
    description: "Validate 11.11 media assets (images, video, skills)",
    args: {},
    async execute() {
      return run("npm run media:validate", process.cwd());
    },
  }),

  "11_11.env_check": tool({
    description: "Check availability of free media tools (ffmpeg, blender, audacity, imagemagick)",
    args: {},
    async execute() {
      return run("npm run env:check", process.cwd());
    },
  }),

  "11_11.env_setup": tool({
    description: "Generate a manifest of detected media tools",
    args: {},
    async execute() {
      return run("npm run env:setup", process.cwd());
    },
  }),

  "11_11.skill_count": tool({
    description: "Count installed 11.11 skills and commands",
    args: {},
    async execute() {
      const root = process.cwd();
      const count = (dir: string) => {
        try {
          return readFileSync(join(root, dir, "SKILL.md"), "utf8").length;
        } catch {
          return 0;
        }
      };
      const lines: string[] = [];
      const skills = ["11-11-chess", "11-11-puzzles", "11-11-audio", "11-11-ui", "11-11-cinematic-assets", "11-11-3d-pipeline", "11-11-image-generation", "11-11-free-media-tools", "11-11-blender-cli", "11-11-canva-cli", "11-11-comfyui", "11-11-tts", "11-11-ffmpeg", "11-11-audacity", "11-11-imagemagick", "11-11-stable-diffusion", "11-11-ai-audio", "11-11-mcp-integration", "11-11-kilo-config", "11-11-unity", "11-11-unity-cli", "11-11-canva", "11-11-blender"];
      for (const s of skills) {
        const a = existsSync(join(root, ".agents/skills", s, "SKILL.md"));
        const b = existsSync(join(root, ".kilo/skills", s, "SKILL.md"));
        if (a || b) lines.push(`${s}: agents=${a} kilo=${b}`);
      }
      return lines.join("\n");
    },
  }),

  "11_11.rule_lookup": tool({
    description: "Read the 11.11 project rules",
    args: {},
    async execute() {
      const p = join(process.cwd(), "artifacts", "eleven-eleven", "AGENT_RULES.md");
      if (!existsSync(p)) return "AGENT_RULES.md not found";
      return readFileSync(p, "utf8");
    },
  }),

  "11_11.lore_lookup": tool({
    description: "Read the 11.11 canon lore",
    args: {},
    async execute() {
      const p = join(process.cwd(), "artifacts", "eleven-eleven", "src", "lore.ts");
      if (!existsSync(p)) return "lore.ts not found";
      const content = readFileSync(p, "utf8");
      return content.length > 5000 ? content.slice(0, 5000) + "\n... (truncated)" : content;
    },
  }),

  "11_11.write_skill": tool({
    description: "Create or update a 11.11 skill SKILL.md file (in both .agents/skills and .kilo/skills)",
    args: {
      name: tool.schema.string().describe("kebab-case skill name (e.g. 11-11-chess)"),
      description: tool.schema.string().describe("short description of when to use this skill"),
      body: tool.schema.string().describe("markdown body content (after frontmatter)"),
    },
    async execute(args: { name: string; description: string; body: string }) {
      const front = `---\nname: ${args.name}\ndescription: ${args.description}\nmetadata:\n  category: game-development\n  source:\n    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'\n    path: .agents/skills/${args.name}\n    license: project-internal\n---\n\n`;
      const content = front + args.body + "\n";
      for (const dir of [".agents/skills", ".kilo/skills"]) {
        const p = join(process.cwd(), dir, args.name, "SKILL.md");
        writeFileSync(p, content);
      }
      return `wrote ${args.name} to .agents/skills and .kilo/skills`;
    },
  }),

  "11_11.write_command": tool({
    description: "Create a 11.11 slash command in .kilocode/commands",
    args: {
      name: tool.schema.string().describe("command name (kebab-case, alphanumeric + hyphens)"),
      description: tool.schema.string().describe("short description shown in /help"),
      body: tool.schema.string().describe("command body content (after frontmatter)"),
    },
    async execute(args: { name: string; description: string; body: string }) {
      const front = `---\ndescription: ${args.description}\n---\n\n`;
      const content = front + args.body + "\n";
      const p = join(process.cwd(), ".kilocode", "commands", `${args.name}.md`);
      writeFileSync(p, content);
      return `wrote command /${args.name} to .kilocode/commands`;
    },
  }),

  "11_11.help": tool({
    description: "List all 11.11 slash commands and skills",
    args: {},
    async execute() {
      const root = process.cwd();
      const commands: string[] = [];
      try {
        const dir = join(root, ".kilocode", "commands");
        const fs = await import("node:fs/promises");
        for (const f of await fs.readdir(dir)) {
          if (f.endsWith(".md")) commands.push(`/${f.replace(/\.md$/, "")}`);
        }
      } catch {
        // ignore
      }
      const skills: string[] = [];
      for (const dir of [".agents/skills", ".kilo/skills"]) {
        try {
          const fs = await import("node:fs/promises");
          for (const f of await fs.readdir(dir)) {
            if (!skills.includes(f)) skills.push(f);
          }
        } catch {
          // ignore
        }
      }
      return [
        "## Commands (" + commands.length + ")",
        commands.sort().join(", "),
        "",
        "## Skills (" + skills.length + ")",
        skills.sort().join(", "),
      ].join("\n");
    },
  }),
});
