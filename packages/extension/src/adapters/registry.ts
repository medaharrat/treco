import type { AIProviderAdapter } from "@ai-footprint/core";
import { chatgptAdapter } from "./providers/chatgpt.js";
import { claudeAdapter } from "./providers/claude.js";
import { geminiAdapter } from "./providers/gemini.js";
import { copilotAdapter } from "./providers/copilot.js";
import { deepseekAdapter } from "./providers/deepseek.js";
import { perplexityAdapter } from "./providers/perplexity.js";
import { grokAdapter } from "./providers/grok.js";
import { mistralAdapter } from "./providers/mistral.js";
import { poeAdapter } from "./providers/poe.js";
import { characteraiAdapter } from "./providers/characterai.js";

/**
 * Every supported provider adapter. Adding a new provider means adding one
 * entry here (plus its config file and a core registry/profile entry) -
 * nothing else in the extension needs to change.
 */
export const ALL_ADAPTERS: AIProviderAdapter[] = [
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

export function findAdapterForCurrentPage(): AIProviderAdapter | null {
  return ALL_ADAPTERS.find((adapter) => adapter.detect()) ?? null;
}

export function findAdapterById(id: string): AIProviderAdapter | undefined {
  return ALL_ADAPTERS.find((adapter) => adapter.id === id);
}
