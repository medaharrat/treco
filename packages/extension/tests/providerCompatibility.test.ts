import { describe } from "vitest";
import { ALL_ADAPTERS } from "../src/adapters/registry.js";
import { runProviderCompatibilitySuite } from "./providerCompatibility.js";

/**
 * Fixture/hostname map kept in one place so a newly added provider only
 * needs one new entry here (plus its fixture file) to be exercised by the
 * full compatibility suite - this is the "provider compatibility test
 * framework" for adding additional AI websites easily.
 */
const HOSTNAME_AND_FIXTURE_BY_ID: Record<string, { hostname: string; fixture: string }> = {
  chatgpt: { hostname: "chatgpt.com", fixture: "chatgpt" },
  claude: { hostname: "claude.ai", fixture: "claude" },
  gemini: { hostname: "gemini.google.com", fixture: "gemini" },
  copilot: { hostname: "copilot.microsoft.com", fixture: "copilot" },
  deepseek: { hostname: "chat.deepseek.com", fixture: "deepseek" },
  perplexity: { hostname: "www.perplexity.ai", fixture: "perplexity" },
  grok: { hostname: "grok.com", fixture: "grok" },
  mistral: { hostname: "chat.mistral.ai", fixture: "mistral" },
  poe: { hostname: "poe.com", fixture: "poe" },
  characterai: { hostname: "character.ai", fixture: "characterai" }
};

describe("provider compatibility framework", () => {
  for (const adapter of ALL_ADAPTERS) {
    const mapping = HOSTNAME_AND_FIXTURE_BY_ID[adapter.id];
    if (!mapping) {
      throw new Error(`No compatibility fixture registered for adapter "${adapter.id}" - add one to HOSTNAME_AND_FIXTURE_BY_ID.`);
    }
    describe(adapter.name, () => {
      runProviderCompatibilitySuite(adapter, mapping.hostname, mapping.fixture);
    });
  }
});
