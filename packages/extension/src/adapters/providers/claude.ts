import { createDomAdapter } from "../shared/domAdapterFactory.js";

/**
 * Claude (claude.ai). Anthropic's web client uses data-testid attributes on
 * message turns in most recent UI revisions; these are still an inferred
 * convention, not a documented contract, so the generic fallback matters here too.
 */
export const claudeAdapter = createDomAdapter({
  id: "claude",
  name: "Claude",
  domains: ["claude.ai"],
  containerSelectors: ['[data-testid="chat-messages"]', "main"],
  assistantMessageSelectors: ['[data-testid="assistant-message"]', '[data-is-streaming="false"]'],
  userMessageSelectors: ['[data-testid="user-message"]'],
  modelSelector: '[data-testid="model-selector-dropdown"]',
  defaultModel: "Claude default model"
});
