import { tool } from "@opencode-ai/plugin";

const DESIGN_TOKEN_PATTERNS = [
  {
    pattern:
      /(?:^|[^-])color(?:-|:|'|")(?![a-zA-Z]*(?:primary|secondary|success|warning|error|neutral|info|background|foreground|muted|accent|destructive|card|popover|border|input|ring))/i,
    description: "Hardcoded color (not using design token)",
  },
  {
    pattern: /rounded-(?:sm|md|lg|xl|2xl|3xl|full)(?!.*[{(])/,
    description: "Hardcoded border radius (should use token)",
  },
  {
    pattern: /shadow-(?:sm|md|lg|xl|2xl)(?!.*[{(])/,
    description: "Hardcoded shadow (should use elevation token)",
  },
  {
    pattern: /(?<![a-zA-Z-])(?:p|m|gap)-\[(\d+px)\]/,
    description: "Hardcoded spacing value (should use 4px/8px grid)",
  },
  {
    pattern: /font-(?:thin|extralight|light|medium|extrabold|black)/,
    description: "Non-standard font weight (check type scale)",
  },
  {
    pattern: /text-(?:xs|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/,
    description: "Hardcoded text size (should use type scale)",
  },
];

const ACCESSIBILITY_PATTERNS = [
  {
    pattern: /<button[^>]*(?!aria-label|aria-labelledby)[^>]*>[^<]*<\/button>/gi,
    description: "Button without ARIA label (check if icon-only)",
  },
  {
    pattern: /<img[^>]*alt=(?!"[^"]+")[^>]*>/gi,
    description: "Image with empty or missing alt text",
  },
  {
    pattern: /color:\s*#[0-9a-fA-F]{3,6};\s*(?:background-color|bg):/i,
    description: "Hardcoded color pair (check contrast)",
  },
];

const _STATE_PATTERNS = [
  {
    pattern: /:(?:hover|focus|active|disabled)\s*\{/g,
    description: "Missing interactive states (only pseudo-classes found)",
  },
];

interface AuditIssue {
  file: string;
  line: number;
  severity: "blocker" | "major" | "minor";
  description: string;
  suggestion?: string;
}

function auditFileContent(filePath: string, content: string): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const lines = content.split("\n");

  for (const check of DESIGN_TOKEN_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(check.pattern);
      if (match) {
        issues.push({
          file: filePath,
          line: i + 1,
          severity: match[0].includes("color") ? "blocker" : "major",
          description: check.description,
          suggestion: `Use design system token instead: ${check.description}`,
        });
      }
    }
  }

  for (const check of ACCESSIBILITY_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(check.pattern);
      if (match) {
        issues.push({
          file: filePath,
          line: i + 1,
          severity: "blocker",
          description: check.description,
          suggestion: "Ensure ARIA labels and alt text are present",
        });
      }
    }
  }

  const hasInteractiveElements = lines.some(
    (l) => l.includes("button") || l.includes("a ") || l.includes("input") || l.includes("select"),
  );
  if (hasInteractiveElements) {
    const hasHover = lines.filter((l) => l.includes("hover:")).length > 0;
    const hasFocus = lines.filter((l) => l.includes("focus:")).length > 0;
    if (!hasHover || !hasFocus) {
      issues.push({
        file: filePath,
        line: 1,
        severity: "major",
        description: "Interactive elements missing hover or focus states",
        suggestion: "Add :hover and :focus states to all interactive elements",
      });
    }
  }

  return issues;
}

export const audit = tool({
  description:
    "Audit visual design quality — checks for hardcoded tokens, accessibility issues, missing states, and design system compliance",
  args: {
    filePaths: tool.schema
      .array(tool.schema.string())
      .describe("Array of relative file paths to audit (e.g., ['apps/web/components/Button.tsx'])"),
  },
  async execute(args) {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const allIssues: AuditIssue[] = [];

    for (const filePath of args.filePaths) {
      try {
        const resolved = path.resolve(process.cwd(), filePath);
        const content = await fs.readFile(resolved, "utf-8");
        const issues = auditFileContent(filePath, content);
        allIssues.push(...issues);
      } catch {
        allIssues.push({
          file: filePath,
          line: 1,
          severity: "minor",
          description: `Could not read file: ${filePath}`,
          suggestion: "Verify the file path exists",
        });
      }
    }

    const blockers = allIssues.filter((i) => i.severity === "blocker");
    const majors = allIssues.filter((i) => i.severity === "major");
    const minors = allIssues.filter((i) => i.severity === "minor");

    const result =
      blockers.length > 0 ? "REJECTED" : majors.length > 5 ? "CONDITIONAL" : "APPROVED";

    return `## Design QA Audit\n\n### Result: ${result}\n\n### Blocker (${blockers.length})\n${blockers.map((i) => `- [${i.file}:${i.line}] ${i.description}`).join("\n") || "(none)"}\n\n### Major (${majors.length})\n${majors.map((i) => `- [${i.file}:${i.line}] ${i.description}`).join("\n") || "(none)"}\n\n### Minor (${minors.length})\n${minors.map((i) => `- [${i.file}:${i.line}] ${i.description}\n  Suggestion: ${i.suggestion}`).join("\n") || "(none)"}\n\n### Summary\n- ✅ ${allIssues.length - blockers.length - majors.length - minors.length} clean checks\n- ❌ ${blockers.length} blocker, ${majors.length} major, ${minors.length} minor`;
  },
});
