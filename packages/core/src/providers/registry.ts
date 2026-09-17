import type { ProviderDefinition, ProviderId } from "../types.js";

/**
 * Data-only registry of supported AI web applications.
 * Adding a new provider means adding an entry here, a matching
 * ModelFootprintProfile (or relying on the fallback tier), and a
 * content-script adapter in the extension package - nothing else in
 * core needs to change.
 */
export const PROVIDER_REGISTRY: ProviderDefinition[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    domains: ["chat.openai.com", "chatgpt.com"],
    description: "OpenAI's ChatGPT web app.",
    color: "#10a37f",
    knownModels: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "o1", "o3", "gpt-3.5"],
    observability: "dom-heuristic"
  },
  {
    id: "claude",
    name: "Claude",
    domains: ["claude.ai"],
    description: "Anthropic's Claude web app.",
    color: "#d97757",
    knownModels: ["claude-opus", "claude-sonnet", "claude-haiku"],
    observability: "dom-heuristic"
  },
  {
    id: "gemini",
    name: "Gemini",
    domains: ["gemini.google.com"],
    description: "Google's Gemini web app.",
    color: "#4285f4",
    knownModels: ["gemini-pro", "gemini-flash", "gemini-ultra"],
    observability: "dom-heuristic"
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    domains: ["copilot.microsoft.com"],
    description: "Microsoft Copilot web app.",
    color: "#0078d4",
    knownModels: ["copilot-default"],
    observability: "dom-heuristic"
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    domains: ["chat.deepseek.com"],
    description: "DeepSeek's web chat.",
    color: "#4d6bfe",
    knownModels: ["deepseek-chat", "deepseek-reasoner"],
    observability: "dom-heuristic"
  },
  {
    id: "perplexity",
    name: "Perplexity",
    domains: ["www.perplexity.ai", "perplexity.ai"],
    description: "Perplexity AI answer engine.",
    color: "#20808d",
    knownModels: ["perplexity-default", "perplexity-pro"],
    observability: "dom-heuristic"
  },
  {
    id: "grok",
    name: "Grok",
    domains: ["grok.com", "x.com"],
    description: "xAI's Grok, on grok.com and within X.",
    color: "#000000",
    knownModels: ["grok-default"],
    observability: "dom-heuristic"
  },
  {
    id: "mistral",
    name: "Le Chat",
    domains: ["chat.mistral.ai"],
    description: "Mistral AI's Le Chat web app.",
    color: "#ff7000",
    knownModels: ["mistral-large", "mistral-small"],
    observability: "dom-heuristic"
  },
  {
    id: "poe",
    name: "Poe",
    domains: ["poe.com"],
    description: "Quora's multi-model Poe platform.",
    color: "#6c3ef4",
    knownModels: ["poe-default"],
    observability: "dom-heuristic"
  },
  {
    id: "characterai",
    name: "Character.AI",
    domains: ["character.ai", "beta.character.ai"],
    description: "Character.AI conversational personas.",
    color: "#f0513d",
    knownModels: ["characterai-default"],
    observability: "dom-heuristic"
  }
];

const byDomain: Map<string, ProviderDefinition> = new Map();
for (const provider of PROVIDER_REGISTRY) {
  for (const domain of provider.domains) {
    byDomain.set(domain, provider);
  }
}

const byId: Map<ProviderId, ProviderDefinition> = new Map(
  PROVIDER_REGISTRY.map((p) => [p.id, p])
);

export function getProviderByDomain(hostname: string): ProviderDefinition | undefined {
  return byDomain.get(hostname);
}

export function getProviderById(id: ProviderId): ProviderDefinition | undefined {
  return byId.get(id);
}

export function allProviderDomains(): string[] {
  return Array.from(byDomain.keys());
}
