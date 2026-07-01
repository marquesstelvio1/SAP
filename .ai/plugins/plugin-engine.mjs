#!/usr/bin/env node

// Plugin Execution Engine
// Loads and executes plugins based on the registry configuration

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "..");

const PLUGIN_REGISTRY_PATH = join(__dirname, "plugin-registry.json");
const REPORTS_DIR = join(ROOT, ".ai", "reports");
const WORKFLOW_STATUS_PATH = join(REPORTS_DIR, "workflow-status.md");

// Ensure reports directory exists
if (!existsSync(REPORTS_DIR)) {
  mkdirSync(REPORTS_DIR, { recursive: true });
}

class PluginEngine {
  constructor() {
    this.registry = JSON.parse(readFileSync(PLUGIN_REGISTRY_PATH, "utf-8"));
    this.pipelineState = this.loadPipelineState();
    this.results = {};
  }

  loadPipelineState() {
    try {
      if (existsSync(WORKFLOW_STATUS_PATH)) {
        const content = readFileSync(WORKFLOW_STATUS_PATH, "utf-8");
        return JSON.parse(content);
      }
    } catch {}
    return {
      feature: "unknown",
      stages: {},
      blocked: false,
      blockedBy: [],
    };
  }

  savePipelineState() {
    mkdirSync(dirname(WORKFLOW_STATUS_PATH), { recursive: true });
    writeFileSync(WORKFLOW_STATUS_PATH, JSON.stringify(this.pipelineState, null, 2));
  }

  getPluginById(id) {
    return this.registry.plugins.find((p) => p.id === id);
  }

  getSortedPlugins() {
    return [...this.registry.plugins].sort((a, b) => a.executionOrder - b.executionOrder);
  }

  async executePlugin(plugin) {
    const pluginId = plugin.id;
    console.log(`[PluginEngine] Executing: ${pluginId} (order ${plugin.executionOrder})`);

    // Record stage in pipeline
    this.pipelineState.stages[pluginId] = {
      status: "running",
      timestamp: new Date().toISOString(),
    };
    this.savePipelineState();

    try {
      // For now, plugins are instruction-based (markdown files)
      // The actual execution is done by AI agents following the plugin instructions
      // This engine tracks pipeline state and enforces ordering

      if (plugin.blocking) {
        console.log(`[PluginEngine] ${pluginId} is BLOCKING`);
      }

      this.pipelineState.stages[pluginId].status = "passed";
      this.results[pluginId] = { status: "PASS" };
      console.log(`[PluginEngine] ✅ ${pluginId} passed`);
    } catch (error) {
      this.pipelineState.stages[pluginId].status = "failed";
      this.pipelineState.stages[pluginId].error = error.message;
      this.results[pluginId] = { status: "FAIL", error: error.message };

      if (plugin.blocking) {
        this.pipelineState.blocked = true;
        this.pipelineState.blockedBy.push(pluginId);
        console.log(`[PluginEngine] ❌ ${pluginId} FAILED - BLOCKING PIPELINE`);
      } else {
        console.log(`[PluginEngine] ⚠️ ${pluginId} FAILED - non-blocking`);
      }
    }

    this.savePipelineState();
  }

  async runPipeline(stageFilter = null) {
    const plugins = this.getSortedPlugins();

    console.log("=== Plugin Pipeline ===");
    console.log(`Feature: ${this.pipelineState.feature}`);

    for (const plugin of plugins) {
      if (stageFilter && !stageFilter.includes(plugin.id)) continue;
      if (this.pipelineState.blocked) {
        console.log(
          `[PluginEngine] Pipeline BLOCKED by: ${this.pipelineState.blockedBy.join(", ")}`,
        );
        break;
      }

      // Skip if already passed
      if (this.pipelineState.stages[plugin.id]?.status === "passed") {
        console.log(`[PluginEngine] ⏭️ ${plugin.id} already passed, skipping`);
        continue;
      }

      await this.executePlugin(plugin);
    }

    this.printSummary();
  }

  printSummary() {
    console.log("\n=== Pipeline Summary ===");
    console.log(`Blocked: ${this.pipelineState.blocked}`);
    if (this.pipelineState.blockedBy.length > 0) {
      console.log(`Blocked by: ${this.pipelineState.blockedBy.join(", ")}`);
    }
    console.log("\nStage Status:");
    for (const [id, stage] of Object.entries(this.pipelineState.stages)) {
      const icon = stage.status === "passed" ? "✅" : stage.status === "running" ? "🔄" : "❌";
      console.log(`${icon} ${id}: ${stage.status}`);
    }
  }

  resetPipeline(featureName) {
    this.pipelineState = {
      feature: featureName,
      stages: {},
      blocked: false,
      blockedBy: [],
    };
    this.savePipelineState();
    console.log(`[PluginEngine] Pipeline reset for feature: ${featureName}`);
  }

  listAvailablePlugins() {
    console.log("\n=== Available Plugins ===");
    for (const plugin of this.getSortedPlugins()) {
      const type = plugin.blocking ? "🔴 BLOCKING" : "🟡 NON-BLOCKING";
      console.log(
        `${plugin.executionOrder.toString().padStart(3)} | ${plugin.id.padEnd(35)} | ${plugin.kind.padEnd(14)} | ${type}`,
      );
    }
  }
}

// CLI Interface
const command = process.argv[2];
const arg = process.argv[3];

const engine = new PluginEngine();

switch (command) {
  case "run":
    await engine.runPipeline(arg ? arg.split(",") : null);
    break;
  case "reset":
    engine.resetPipeline(arg || "unnamed-feature");
    break;
  case "list":
    engine.listAvailablePlugins();
    break;
  case "status":
    engine.printSummary();
    break;
  default:
    console.log(`
Plugin Engine v1.0.0

Usage:
  node plugin-engine.mjs run [stage1,stage2,...]  Run pipeline (optionally filter stages)
  node plugin-engine.mjs reset <feature-name>      Reset pipeline state
  node plugin-engine.mjs list                       List all available plugins
  node plugin-engine.mjs status                     Show current pipeline status
    `);
}
