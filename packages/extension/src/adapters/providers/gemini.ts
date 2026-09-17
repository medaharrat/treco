import { createDomAdapter } from "../shared/domAdapterFactory.js";

/**
 * Gemini (gemini.google.com). Google's web client is built with Angular and
 * uses generated/obfuscated class names extensively, so structured selectors
 * are lower-confidence here than for most other providers - this adapter
 * leans more heavily on the generic quiet-period fallback in practice.
 */
export const geminiAdapter = createDomAdapter({
  id: "gemini",
  name: "Gemini",
  domains: ["gemini.google.com"],
  containerSelectors: ["chat-window", "main"],
  assistantMessageSelectors: ["model-response", "message-content.model-response-text"],
  userMessageSelectors: ["user-query", ".query-text"],
  modelSelector: '[data-test-id="bard-mode-menu-button"]',
  defaultModel: "Gemini default model"
});
