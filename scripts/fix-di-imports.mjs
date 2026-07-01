#!/usr/bin/env node

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const API_SRC = join(ROOT, "apps", "api", "src");

function _isFile(p) {
  return statSync(p).isFile();
}

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
 * Find all constructor parameter type names in a file.
 * Properly handles nested parentheses (e.g. @Inject(TOKEN)).
 */
function findConstructorParamTypes(content) {
  const types = new Set();
  // Find constructor keyword position
  const constructorRe = /\bconstructor\s*\(/g;
  let match;
  while ((match = constructorRe.exec(content)) !== null) {
    const start = match.index;
    // Find the opening paren after constructor
    const openParen = match[0].length - 1 + start;
    // Walk forward tracking depth to find matching close paren
    let depth = 1;
    let i = openParen + 1;
    while (i < content.length && depth > 0) {
      if (content[i] === "(") depth++;
      else if (content[i] === ")") depth--;
      i++;
    }
    // params is content between ( and matching )
    const params = content.slice(openParen + 1, i - 1);
    // Extract type names from parameter declarations
    // Matches: paramName: TypeName followed by , or ) or =
    const paramRegex = /:\s*(\w+)\s*(?:[,)=]|$)/g;
    let paramMatch;
    while ((paramMatch = paramRegex.exec(params)) !== null) {
      const typeName = paramMatch[1];
      if (typeName && typeName[0] >= "A" && typeName[0] <= "Z") {
        types.add(typeName);
      }
    }
  }
  return types;
}

/**
 * Parse an import type line and return:
 * { line, symbols: string[] } where symbols are the imported names
 */
function _parseImportTypeLine(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("import type")) return null;

  // Single import: import type { Foo } from "..."
  // Multi import: import type { Foo, Bar, Baz } from "..."
  const braceMatch = trimmed.match(/import\s+type\s+\{\s*([^}]+)\}\s*from/);
  if (braceMatch) {
    const symbols = braceMatch[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/\s+as\s+\w+$/, "").trim())
      .filter((s) => s[0] >= "A" && s[0] <= "Z");
    return { line, symbols };
  }

  // Default import type: import type Foo from "..."
  const defaultMatch = trimmed.match(/import\s+type\s+(\w+)\s+from/);
  if (defaultMatch) {
    const symbol = defaultMatch[1];
    if (symbol[0] >= "A" && symbol[0] <= "Z") {
      return { line, symbols: [symbol] };
    }
  }

  return null;
}

/**
 * For a multi-line import type block (spanning multiple lines), collect ALL symbols.
 * Returns { startLine, endLine, fullText, symbols: string[] }
 */
function _collectImportTypeBlock(lines, startIdx) {
  let fullText = lines[startIdx];
  let i = startIdx;
  const braceStartIdx = fullText.indexOf("{");
  const braceEndIdx = fullText.indexOf("}");

  // Check if it's a single-line import type { X } from "..."
  if (braceStartIdx !== -1 && braceEndIdx !== -1) {
    // Single line import
    return { startIdx, endIdx: startIdx, fullText: lines[startIdx], isMultiLine: false };
  }

  // Multi-line: the brace is not closed on the same line
  if (braceStartIdx !== -1 && braceEndIdx === -1) {
    i++;
    while (i < lines.length) {
      fullText += `\n${lines[i]}`;
      if (lines[i].includes("}")) {
        break;
      }
      i++;
    }
    return { startIdx, endIdx: i, fullText, isMultiLine: true };
  }

  return null;
}

function extractSymbolsFromBlock(text) {
  // Extract everything between { and the first }
  const match = text.match(/\{([^}]*)\}/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) =>
      s
        .trim()
        .replace(/\s+as\s+\w+$/, "")
        .trim(),
    )
    .filter(Boolean);
}

const changedFiles = [];

for (const filePath of walk(API_SRC)) {
  const original = readFileSync(filePath, "utf-8");
  const lines = original.split("\n");
  let modified = false;

  // First pass: find all constructor parameter types
  const constructorTypes = findConstructorParamTypes(original);

  if (constructorTypes.size === 0) continue;

  // Find all import type lines/blocks that need to be changed
  const _replacements = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed.startsWith("import type")) continue;

    // Determine the type of import
    const defaultMatch = trimmed.match(/^import\s+type\s+(\w+)\s+from/);
    if (defaultMatch) {
      // import type Foo from "..."
      const symbol = defaultMatch[1];
      if (constructorTypes.has(symbol)) {
        lines[i] = line.replace(/^import\s+type\s+/, "import ");
        modified = true;
      }
      continue;
    }

    // import type { X, Y } from "..." or import type {\n X \n} from "..."
    const braceStartIdx = trimmed.indexOf("{");
    if (braceStartIdx === -1) continue;

    // Check if braces close on same line
    const braceEndIdx = trimmed.indexOf("}", braceStartIdx);
    const importPrefix = trimmed.substring(0, braceStartIdx); // "import type " or "import type"
    const isTypeImport = importPrefix.includes("import type");

    if (!isTypeImport) continue;

    if (braceEndIdx !== -1) {
      // Single line: import type { X, Y } from "..."
      const symbols = extractSymbolsFromBlock(trimmed);
      const symbolsToRemoveType = symbols.filter((s) => constructorTypes.has(s));
      if (symbolsToRemoveType.length > 0) {
        // Replace "import type {" with "import {"
        // But only if ALL symbols in this import are used in constructor
        // Actually per the rules: if ANY symbol is used in constructor, remove 'type'
        // But we need to be careful - we should only remove 'type' for symbols that are classes
        // Since 'import type { X, Y }' imports all as type, we need to change to 'import { X, Y }'
        // The user's rule says: "Only change import type { SYMBOL } to import { SYMBOL } - NEVER change import type imports for type-only symbols"
        // If some symbols in the import are type-only and some are classes, we need to split them
        // Let's handle this: if ALL uppercase-starting symbols in the import are constructor types, we can safely remove 'type'
        // If only some are, we need to split

        const allUpperSymbols = symbols.filter((s) => s[0] >= "A" && s[0] <= "Z");
        const typeOnlyUpper = allUpperSymbols.filter((s) => !constructorTypes.has(s));

        if (typeOnlyUpper.length === 0) {
          // ALL uppercase symbols are constructor-injected - safe to remove 'type'
          lines[i] = line.replace(/^(\s*)import\s+type\s+/, "$1import ");
          modified = true;
        } else {
          // Need to split: constructor-injected classes go to regular import, type-only stay
          const classesToKeep = symbols.filter((s) => constructorTypes.has(s));
          const typesToKeep = symbols.filter((s) => !constructorTypes.has(s));

          // Replace current line with two imports
          const indent = line.match(/^\s*/)[0];
          const fromPart = trimmed.match(/\s+from\s+["'].*["']\s*;?\s*$/)[0];

          if (classesToKeep.length > 0 && typesToKeep.length > 0) {
            lines[i] = `${indent}import { ${classesToKeep.join(", ")} }${fromPart}`;
            lines.splice(i + 1, 0, `${indent}import type { ${typesToKeep.join(", ")} }${fromPart}`);
            modified = true;
          }
        }
      }
    } else {
      // Multi-line: import type {\n X, \n Y \n} from "..."
      // Find the closing brace
      let blockEnd = i;
      let blockText = line;
      let j = i + 1;
      while (j < lines.length) {
        blockText += `\n${lines[j]}`;
        if (lines[j].includes("}")) {
          blockEnd = j;
          break;
        }
        j++;
      }

      const symbols = extractSymbolsFromBlock(blockText);
      const allUpperSymbols = symbols.filter((s) => s[0] >= "A" && s[0] <= "Z");
      const typeOnlyUpper = allUpperSymbols.filter((s) => !constructorTypes.has(s));

      if (typeOnlyUpper.length === 0) {
        // All uppercase symbols are constructor-injected - just remove 'type'
        lines[i] = lines[i].replace(/^(\s*)import\s+type\s+/, "$1import ");
        modified = true;
      } else {
        // Need to split
        const classesToKeep = symbols.filter((s) => constructorTypes.has(s));
        const typesToKeep = symbols.filter((s) => !constructorTypes.has(s));

        if (classesToKeep.length > 0) {
          // Reconstruct the import
          const fromMatch = blockText.match(/\s+from\s+["'].*["']\s*;?\s*$/m);
          const fromPart = fromMatch ? fromMatch[0] : "";
          const indent = lines[i].match(/^\s*/)[0];

          // Replace the multi-line block with two imports
          if (typesToKeep.length > 0) {
            // Need both class and type imports
            const classImportLines = [`${indent}import { ${classesToKeep.join(", ")} }${fromPart}`];
            const typeImportLines = [
              `${indent}import type {`,
              ...typesToKeep.map((s) => `${indent}  ${s},`),
              `${indent}}${fromPart}`,
            ];
            const replacement = [...classImportLines, ...typeImportLines];

            // Replace lines from i to blockEnd with the new content
            const removeCount = blockEnd - i + 1;
            lines.splice(i, removeCount, ...replacement);
            modified = true;
            i += replacement.length - 1; // Skip past the inserted lines
          } else {
            // Only classes remain, just remove 'type'
            lines[i] = lines[i].replace(/^(\s*)import\s+type\s+/, "$1import ");
            modified = true;
          }
        }
      }
    }
  }

  if (modified) {
    const newContent = lines.join("\n");
    writeFileSync(filePath, newContent, "utf-8");
    changedFiles.push(filePath);
    console.error("[FIXED]", relative(ROOT, filePath));
  } else {
    console.error("[SKIP]", relative(ROOT, filePath), "- no constructor-used types in import type");
  }
}

console.log("\n=== SUMMARY ===");
if (changedFiles.length === 0) {
  console.log("No files were changed.");
} else {
  console.log(`Changed ${changedFiles.length} file(s):`);
  for (const f of changedFiles) {
    console.log(`  ${relative(ROOT, f)}`);
  }
}
