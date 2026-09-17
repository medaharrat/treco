import { createDomAdapter } from "../shared/domAdapterFactory.js";

/**
 * Grok (grok.com, and embedded within x.com). The x.com integration is
 * embedded inside a much larger, unrelated social app - the generic fallback
 * intentionally only measures growth within the narrowest container it can
 * find so it doesn't pick up unrelated timeline content.
 */
export const grokAdapter = createDomAdapter({
  id: "grok",
  name: "Grok",
  domains: ["grok.com", "x.com"],
  containerSelectors: ['[data-testid="grok-conversation"]', "main"],
  assistantMessageSelectors: ['[data-testid="grok-message-assistant"]'],
  userMessageSelectors: ['[data-testid="grok-message-user"]'],
  defaultModel: "Grok default model"
});
