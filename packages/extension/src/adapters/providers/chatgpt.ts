import { createDomAdapter } from "../shared/domAdapterFactory.js";

/**
 * ChatGPT (chat.openai.com / chatgpt.com).
 *
 * `[data-message-author-role]` has been a comparatively stable attribute in
 * OpenAI's web client for turn attribution, but OpenAI does not document it
 * as a public API and it can change without notice - hence the generic
 * quiet-period fallback in the shared factory if these selectors stop
 * matching.
 */
export const chatgptAdapter = createDomAdapter({
  id: "chatgpt",
  name: "ChatGPT",
  domains: ["chat.openai.com", "chatgpt.com"],
  containerSelectors: ["main", "#__next main", "div.flex.h-full.flex-col"],
  assistantMessageSelectors: ['[data-message-author-role="assistant"]'],
  userMessageSelectors: ['[data-message-author-role="user"]'],
  modelSelector: '[data-testid="model-switcher-dropdown-button"]',
  defaultModel: "ChatGPT default model"
});
