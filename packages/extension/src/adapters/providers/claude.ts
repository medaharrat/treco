import { createDomAdapter } from "../shared/domAdapterFactory.js";

/**
 * Claude (claude.ai). Anthropic's web client uses data-testid attributes on
 * message turns in most recent UI revisions; these are still an inferred
 * convention, not a documented contract, so the generic fallback matters here too.
 *
 * "main" is preferred over the narrower chat-messages container specifically
 * because Claude's Artifacts panel (generated documents, code, canvases)
 * renders in a separate side pane, not inside the message list - a container
 * scoped to just the chat feed would never see that pane's content grow, so
 * the generic text-growth fallback would silently miss it entirely.
 */
export const claudeAdapter = createDomAdapter({
  id: "claude",
  name: "Claude",
  domains: ["claude.ai"],
  containerSelectors: ["main", '[data-testid="chat-messages"]'],
  assistantMessageSelectors: ['[data-testid="assistant-message"]', '[data-is-streaming="false"]'],
  userMessageSelectors: ['[data-testid="user-message"]'],
  modelSelector: '[data-testid="model-selector-dropdown"]',
  defaultModel: "Claude default model"
});
