import { tool } from "@opencode-ai/plugin";

export const report = tool({
  description: "Generate a report of available enterprise skills and their coverage status",
  args: {},
  async execute() {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const os = await import("node:os");

    const SKILLS_DIRS = [
      path.resolve(os.homedir(), ".agents/skills"),
      path.resolve(os.homedir(), ".config/opencode/skills"),
      path.resolve(process.cwd(), ".opencode/skills"),
      path.resolve(process.cwd(), ".agents/skills"),
    ];

    const AGENTS_DIRS = [
      path.resolve(process.cwd(), ".opencode/agents"),
      path.resolve(os.homedir(), ".config/opencode/agents"),
      path.resolve(process.cwd(), ".agents"),
    ];

    const skills: { name: string; location: string; hasSkill: boolean; hasAgent: boolean }[] = [];

    const ENTERPRISE_DEPARTMENTS = [
      "enterprise-executive",
      "enterprise-product",
      "enterprise-ux-research",
      "enterprise-visual-design",
      "enterprise-learning-design",
      "enterprise-frontend",
      "enterprise-backend",
      "enterprise-database",
      "enterprise-architecture",
      "enterprise-security",
      "enterprise-devops",
      "enterprise-qa",
      "enterprise-performance",
      "enterprise-documentation",
      "enterprise-ai-engineering",
      "enterprise-design-qa",
    ];

    for (const dept of ENTERPRISE_DEPARTMENTS) {
      let hasSkill = false;
      let skillLocation = "";
      let hasAgent = false;

      for (const dir of SKILLS_DIRS) {
        try {
          await fs.access(path.join(dir, dept, "SKILL.md"));
          hasSkill = true;
          skillLocation = dir;
          break;
        } catch {
          // not found in this dir
        }
      }

      for (const dir of AGENTS_DIRS) {
        try {
          await fs.access(path.join(dir, `${dept}.md`));
          hasAgent = true;
          break;
        } catch {
          // not found in this dir
        }
      }

      skills.push({ name: dept, location: skillLocation, hasSkill, hasAgent });
    }

    const totalWithSkill = skills.filter((s) => s.hasSkill).length;
    const totalWithAgent = skills.filter((s) => s.hasAgent).length;

    const lines = [
      "## Enterprise Organization Coverage Report\n",
      `| Department | Skill | Agent | Location |`,
      `|---|---|---|---|`,
    ];

    for (const s of skills) {
      const skillStatus = s.hasSkill ? "✅" : "❌";
      const agentStatus = s.hasAgent ? "✅" : "❌";
      const loc = s.location ? s.location.replace(os.homedir(), "~") : "-";
      lines.push(
        `| ${s.name.replace("enterprise-", "")} | ${skillStatus} | ${agentStatus} | ${loc} |`,
      );
    }

    lines.push(
      `\n### Summary`,
      `- Skills: ${totalWithSkill}/16 (${Math.round((totalWithSkill / 16) * 100)}%)`,
      `- Agents: ${totalWithAgent}/16 (${Math.round((totalWithAgent / 16) * 100)}%)`,
      `- Complete (both): ${skills.filter((s) => s.hasSkill && s.hasAgent).length}/16`,
      `- Missing skill: ${
        skills
          .filter((s) => !s.hasSkill)
          .map((s) => s.name.replace("enterprise-", ""))
          .join(", ") || "none"
      }`,
      `- Missing agent: ${
        skills
          .filter((s) => !s.hasAgent)
          .map((s) => s.name.replace("enterprise-", ""))
          .join(", ") || "none"
      }`,
    );

    return lines.join("\n");
  },
});
