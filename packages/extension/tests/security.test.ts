import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chatgptAdapter } from "../src/adapters/providers/chatgpt.js";
import { claudeAdapter } from "../src/adapters/providers/claude.js";
import { geminiAdapter } from "../src/adapters/providers/gemini.js";
import { copilotAdapter } from "../src/adapters/providers/copilot.js";
import { deepseekAdapter } from "../src/adapters/providers/deepseek.js";
import { perplexityAdapter } from "../src/adapters/providers/perplexity.js";
import { grokAdapter } from "../src/adapters/providers/grok.js";
import { mistralAdapter } from "../src/adapters/providers/mistral.js";
import { poeAdapter } from "../src/adapters/providers/poe.js";
import { characteraiAdapter } from "../src/adapters/providers/characterai.js";
import { withHost } from "./harness.js";

const ALL_ADAPTERS = [
  chatgptAdapter,
  claudeAdapter,
  geminiAdapter,
  copilotAdapter,
  deepseekAdapter,
  perplexityAdapter,
  grokAdapter,
  mistralAdapter,
  poeAdapter,
  characteraiAdapter
];

describe("security: provider adapters are domain-isolated from each other", () => {
  it("no adapter detects another provider's domain", () => {
    for (const owner of ALL_ADAPTERS) {
      for (const other of ALL_ADAPTERS) {
        if (owner.id === other.id) continue;
        for (const otherDomain of other.domains) {
          if (owner.domains.includes(otherDomain)) continue; // legitimately shared domain, not a leak
          withHost(otherDomain, () => {
            expect(owner.detect(), `${owner.id} adapter incorrectly detected ${other.id}'s domain (${otherDomain})`).toBe(false);
          });
        }
      }
    }
  });

  it("no adapter detects an arbitrary unrelated site", () => {
    for (const adapter of ALL_ADAPTERS) {
      withHost("totally-unrelated-website.example", () => {
        expect(adapter.detect()).toBe(false);
      });
    }
  });
});

describe("security: no network-capable code ships in the source tree", () => {
  const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /\bfetch\s*\(/, label: "fetch(" },
    { pattern: /XMLHttpRequest/, label: "XMLHttpRequest" },
    { pattern: /\bnew\s+WebSocket\s*\(/, label: "new WebSocket(" },
    { pattern: /\bnew\s+EventSource\s*\(/, label: "new EventSource(" },
    { pattern: /sendBeacon/, label: "navigator.sendBeacon" },
    { pattern: /\beval\s*\(/, label: "eval(" },
    { pattern: /\bnew\s+Function\s*\(/, label: "new Function(" }
  ];

  function collectSourceFiles(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "tests") continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        collectSourceFiles(full, out);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        out.push(full);
      }
    }
    return out;
  }

  it("packages/extension/src and packages/core/src contain no fetch/XHR/WebSocket/eval/Function", () => {
    const roots = [join(__dirname, "..", "src"), join(__dirname, "..", "..", "core", "src")];
    const offenders: string[] = [];

    for (const root of roots) {
      for (const file of collectSourceFiles(root)) {
        const content = readFileSync(file, "utf-8");
        for (const { pattern, label } of FORBIDDEN_PATTERNS) {
          if (pattern.test(content)) {
            offenders.push(`${file}: contains ${label}`);
          }
        }
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("security: production build artifact (skipped if not built)", () => {
  const distDir = join(__dirname, "..", "dist", "chrome");
  const manifestPath = join(distDir, "manifest.json");
  const built = existsSync(manifestPath);

  it.runIf(built)("built JS bundles contain no network-capable calls", () => {
    const jsFiles: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".js")) jsFiles.push(full);
      }
    };
    walk(distDir);

    const offenders: string[] = [];
    for (const file of jsFiles) {
      const content = readFileSync(file, "utf-8");
      if (/\bfetch\s*\(/.test(content)) offenders.push(`${file}: fetch(`);
      if (/XMLHttpRequest/.test(content)) offenders.push(`${file}: XMLHttpRequest`);
      if (/\bnew\s+WebSocket\s*\(/.test(content)) offenders.push(`${file}: new WebSocket(`);
      if (/sendBeacon/.test(content)) offenders.push(`${file}: sendBeacon`);
      if (/\beval\s*\(/.test(content)) offenders.push(`${file}: eval(`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it.runIf(built)("manifest requests only the minimum expected permissions", () => {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    expect(manifest.permissions.sort()).toEqual(["storage"]);
    expect(manifest.externally_connectable).toBeUndefined();

    const forbidden = ["tabs", "history", "cookies", "debugger", "webRequest", "webNavigation", "downloads", "management"];
    for (const perm of forbidden) {
      expect(manifest.permissions).not.toContain(perm);
    }
    expect(manifest.host_permissions).not.toContain("<all_urls>");
    expect(manifest.host_permissions.every((p: string) => p !== "*://*/*")).toBe(true);
  });

  it.runIf(built)("host permissions are limited to registered provider domains", async () => {
    const { PROVIDER_REGISTRY } = await import("@ai-footprint/core");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const allowedDomains = new Set(PROVIDER_REGISTRY.flatMap((p: { domains: string[] }) => p.domains));

    for (const pattern of manifest.host_permissions as string[]) {
      const domain = pattern.replace(/^\*:\/\//, "").replace(/\/\*$/, "");
      expect(allowedDomains.has(domain), `unexpected host permission for domain: ${domain}`).toBe(true);
    }
  });
});
