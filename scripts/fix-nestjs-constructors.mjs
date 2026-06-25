#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const API_SRC = join(ROOT, "apps", "api", "src");

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      yield* walk(p);
    } else if (entry.endsWith(".ts")) {
      yield p;
    }
  }
}

/**
 * Collect all type-only symbol names from import statements.
 */
function collectTypeOnlyImports(content) {
  const typeOnly = new Set();

  // import type { X, Y } from "..."
  let re = /^import\s+type\s+\{\s*([^}]+)\}\s*from/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    for (const sym of m[1].split(",").map((s) => s.trim().replace(/\s+as\s+\w+$/, "").trim()).filter(Boolean)) {
      if (sym[0] >= "A" && sym[0] <= "Z") typeOnly.add(sym);
    }
  }

  // import type X from "..."
  re = /^import\s+type\s+(\w+)\s+from/gm;
  while ((m = re.exec(content)) !== null) {
    if (m[1][0] >= "A" && m[1][0] <= "Z") typeOnly.add(m[1]);
  }

  // import { ..., type X, ... } from "..." (mixed imports with `type` modifier)
  re = /import\s+\{[^}]*\}/gs;
  let blockMatch;
  while ((blockMatch = re.exec(content)) !== null) {
    const typeMatches = blockMatch[0].matchAll(/\btype\s+(\w+)/g);
    for (const tm of typeMatches) {
      if (tm[1][0] >= "A" && tm[1][0] <= "Z") typeOnly.add(tm[1]);
    }
  }

  // import X, { type Y, ... } from "..."
  re = /import\s+\w+\s*,\s*\{[^}]*\}/gs;
  while ((blockMatch = re.exec(content)) !== null) {
    const typeMatches = blockMatch[0].matchAll(/\btype\s+(\w+)/g);
    for (const tm of typeMatches) {
      if (tm[1][0] >= "A" && tm[1][0] <= "Z") typeOnly.add(tm[1]);
    }
  }

  return typeOnly;
}

/**
 * Find @Injectable() constructors and extract each parameter with its line number.
 * Returns array of { ctorLine: number, ctorEndLine: number, params: [...] }
 */
function findInjectableConstructors(lines) {
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith("@Injectable")) continue;

    let classLine = i + 1;
    while (classLine < lines.length) {
      const t = lines[classLine].trim();
      if (t.startsWith("export class") || t.startsWith("class ")) break;
      classLine++;
    }
    if (classLine >= lines.length) continue;

    let ctorLine = classLine;
    while (ctorLine < lines.length) {
      if (/\bconstructor\s*\(/.test(lines[ctorLine])) break;
      ctorLine++;
    }
    if (ctorLine >= lines.length) continue;

    // Collect all lines from constructor to matching )
    const ctorLines = [];
    let depth = 0;
    let foundOpen = false;
    let ctorEndLine = ctorLine;

    for (let l = ctorLine; l < lines.length; l++) {
      ctorLines.push({ line: l, text: lines[l] });
      for (const ch of lines[l]) {
        if (ch === "(") { depth++; foundOpen = true; }
        else if (ch === ")") { depth--; }
      }
      if (foundOpen && depth === 0) { ctorEndLine = l; break; }
    }

    // Build the full constructor text for parameter parsing
    const ctorText = ctorLines.map((c) => c.text).join("\n");
    const openParenIdx = ctorText.indexOf("(");
    if (openParenIdx === -1) continue;

    // Extract raw param string block (everything between outer parens)
    const paramsBlock = extractParamsBlock(ctorText);
    if (!paramsBlock) continue;

    // Split into individual param strings (respecting nesting)
    const rawParams = splitTopLevelParams(paramsBlock);

    // Map each raw param to its line in the original file
    const params = [];
    for (const raw of rawParams) {
      const parsed = parseParam(raw, ctorLines, ctorLine);
      if (parsed) params.push(parsed);
    }

    results.push({ ctorLine, ctorEndLine, params });
  }

  return results;
}

function extractParamsBlock(ctorText) {
  const start = ctorText.indexOf("(");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < ctorText.length; i++) {
    if (ctorText[i] === "(") depth++;
    else if (ctorText[i] === ")") {
      depth--;
      if (depth === 0) return ctorText.slice(start + 1, i);
    }
  }
  return null;
}

function splitTopLevelParams(block) {
  const parts = [];
  let depth = 0;
  let bracketDepth = 0;
  let angleDepth = 0;
  let current = "";

  for (const ch of block) {
    if (ch === "(") { depth++; current += ch; }
    else if (ch === ")") { depth--; current += ch; }
    else if (ch === "{") { bracketDepth++; current += ch; }
    else if (ch === "}") { bracketDepth--; current += ch; }
    else if (ch === "<") { angleDepth++; current += ch; }
    else if (ch === ">") { angleDepth--; current += ch; }
    else if (ch === "," && depth === 0 && bracketDepth === 0 && angleDepth === 0) {
      const trimmed = current.trim();
      if (trimmed) parts.push(trimmed);
      current = "";
    } else {
      current += ch;
    }
  }

  const trimmed = current.trim();
  if (trimmed) parts.push(trimmed);

  return parts;
}

function parseParam(rawText, ctorLines, ctorLine) {
  // Find which line in the original file this param starts on.
  // The param text may span multiple lines (decorator + param).
  // We find the first line of the constructor block that is part of this param.
  const firstLineIdx = findParamStartLine(rawText, ctorLines, ctorLine);
  if (firstLineIdx === -1) return null;

  // Determine if optional (?: pattern)
  const isOptional = /\?\s*:/.test(rawText);

  // Find the type name (after the last `:` that's not inside brackets)
  let colonIdx = -1;
  let depth = 0;
  for (let i = 0; i < rawText.length; i++) {
    if (rawText[i] === "(" || rawText[i] === "<" || rawText[i] === "{") depth++;
    else if (rawText[i] === ")" || rawText[i] === ">" || rawText[i] === "}") depth--;
    else if (rawText[i] === ":" && depth === 0) colonIdx = i;
  }
  if (colonIdx === -1) return null;

  const typeStr = rawText.slice(colonIdx + 1).trim();
  const baseType = typeStr.match(/^\w+/)?.[0];
  if (!baseType || baseType[0] < "A" || baseType[0] > "Z") return null;

  // Extract param name
  const beforeColon = rawText.slice(0, colonIdx).replace(/\?\s*$/, "").trim();
  const nameMatch = beforeColon.match(/(\w+)\s*$/);
  const name = nameMatch ? nameMatch[1] : "?";

  // Check if this param text already contains @Inject or @Optional (inline decorator)
  const hasInject = /@Inject\s*\(/.test(rawText);
  const hasOptional = /@Optional\s*\(\)/.test(rawText);

  return {
    rawText,
    name,
    type: baseType,
    isOptional,
    hasInject,
    hasOptional,
    line: firstLineIdx,
  };
}

function findParamStartLine(rawText, ctorLines, ctorLine) {
  // Match the param text to the specific line in the constructor block.
  // The rawText is a single parameter (may include decorators from multi-line).
  // We find the last line of the param text (the actual parameter declaration
  // line, not decorator lines) and return that.

  // Get the last line of the raw param text (the declaration, not decorator)
  const paramLines = rawText.split("\n");
  const declLine = paramLines.filter((l) => !l.trim().startsWith("@")).pop();
  if (!declLine) return ctorLine + 1;

  const declTrimmed = declLine.trim();

  // Search through ctorLines for a line that contains this declaration
  for (let i = 1; i < ctorLines.length; i++) {
    const lineTrimmed = ctorLines[i].text.trim();
    // Match if the trimmed line starts with the declaration or vice versa
    if (lineTrimmed === declTrimmed || lineTrimmed.startsWith(declTrimmed.replace(/,?\s*$/, "")) ||
        declTrimmed.startsWith(lineTrimmed.replace(/,?\s*$/, ""))) {
      return ctorLines[i].line;
    }
  }

  return ctorLine + 1;
}

/**
 * Check if a parameter has @Inject() or @Optional() decorators on lines
 * immediately before it (with no intervening non-blank, non-decorator lines).
 */
function hasDecoratorImmediatelyBefore(lines, paramLine, decoratorType) {
  for (let i = paramLine - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === "") continue;
    if (trimmed.startsWith("@")) {
      if (trimmed.includes(decoratorType)) return true;
      continue;
    }
    // Non-blank, non-decorator line: this is the start of the decorator block boundary
    break;
  }
  return false;
}

/**
 * Ensure that `Optional` is imported from `@nestjs/common` in the file.
 */
function ensureOptionalImport(lines) {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^import\s+\{([^}]*)\}\s*from\s+["']@nestjs\/common["']/);
    if (m) {
      const existing = m[1].split(",").map((s) => s.trim());
      if (!existing.includes("Optional") && !existing.includes("type Optional") &&
          !existing.some((s) => s.replace(/^type\s+/, "").trim() === "Optional")) {
        existing.push("Optional");
        lines[i] = lines[i].replace(/\{([^}]*)\}/, `{ ${existing.join(", ")} }`);
      }
      return;
    }
  }
}

const modifiedFiles = [];
const flaggedFiles = [];

for (const filePath of walk(API_SRC)) {
  const original = readFileSync(filePath, "utf-8");
  const lines = original.split("\n");
  let fileModified = false;

  const typeOnlyImports = collectTypeOnlyImports(original);
  if (typeOnlyImports.size === 0) continue;

  const constructors = findInjectableConstructors(lines);
  if (constructors.length === 0) continue;

  const fileRelativePath = relative(ROOT, filePath);

  for (const ctor of constructors) {
    for (const param of ctor.params) {
      if (param.hasInject || param.hasOptional) continue;
      if (!typeOnlyImports.has(param.type)) continue;

      const hasInjectBefore = hasDecoratorImmediatelyBefore(lines, param.line, "Inject");
      const hasOptionalBefore = hasDecoratorImmediatelyBefore(lines, param.line, "Optional");

      if (hasInjectBefore || hasOptionalBefore) continue;

      if (param.isOptional) {
        const paramLine = param.line;
        const lineIndent = lines[paramLine].match(/^\s*/)[0];

        // If the param is on the same line as constructor(, split it
        if (paramLine === ctor.ctorLine) {
          const ctorText = lines[ctor.ctorLine];
          const openParenIdx = ctorText.indexOf("(");
          const beforeParen = ctorText.slice(0, openParenIdx + 1);
          const afterParen = ctorText.slice(openParenIdx + 1);
          const indent = ctorText.match(/^\s*/)[0];
          lines[ctor.ctorLine] = `${beforeParen}\n${indent}  @Optional()\n${indent}  ${afterParen}`;
          console.log(`[FIXED]  ${fileRelativePath}:${ctor.ctorLine + 1} - Added @Optional() before optional type-only param "${param.name}: ${param.type}"`);
          fileModified = true;
        } else {
          const trimmed = lines[paramLine].trim();
          if (trimmed.startsWith("@")) {
            // Decorator on this line, insert @Optional() after it
            let insertAfter = paramLine;
            let nextLine = paramLine + 1;
            while (nextLine < lines.length && lines[nextLine].trim().startsWith("@")) {
              insertAfter = nextLine;
              nextLine++;
            }
            lines.splice(insertAfter + 1, 0, `${lineIndent}@Optional()`);
            console.log(`[FIXED]  ${fileRelativePath}:${insertAfter + 2} - Added @Optional() before optional type-only param "${param.name}: ${param.type}"`);
            fileModified = true;
          } else {
            lines.splice(paramLine, 0, `${lineIndent}@Optional()`);
            console.log(`[FIXED]  ${fileRelativePath}:${paramLine + 1} - Added @Optional() before optional type-only param "${param.name}: ${param.type}"`);
            fileModified = true;
          }
        }
      } else {
        flaggedFiles.push({
          file: fileRelativePath,
          line: param.line + 1,
          name: param.name,
          type: param.type,
        });
      }
    }
  }

  if (fileModified) {
    ensureOptionalImport(lines);
    const newContent = lines.join("\n");
    writeFileSync(filePath, newContent, "utf-8");
    modifiedFiles.push(fileRelativePath);
  }
}

console.log("\n=== SUMMARY ===");
if (modifiedFiles.length === 0) {
  console.log("No files were modified.");
} else {
  console.log(`Modified ${modifiedFiles.length} file(s):`);
  for (const f of modifiedFiles) {
    console.log("  " + f);
  }
}

if (flaggedFiles.length > 0) {
  console.log(`\n=== FLAGGED (need manual intervention) ===`);
  console.log(`${flaggedFiles.length} required parameter(s) with type-only imports missing @Inject():\n`);
  for (const f of flaggedFiles) {
    console.log(`  ${f.file}:${f.line} - parameter "${f.name}" has type "${f.type}" from import type, needs @Inject() or architectural change`);
  }
} else {
  console.log("\nNo required parameters with type-only imports missing @Inject().");
}
