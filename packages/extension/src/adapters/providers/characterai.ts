import { createDomAdapter } from "../shared/domAdapterFactory.js";

/**
 * Character.AI (character.ai). Persona-driven roleplay chat; turns tend to
 * be shorter and more frequent than assistant-style chat, which the
 * generic fallback's per-quiet-period grouping handles reasonably well.
 */
export const characteraiAdapter = createDomAdapter({
  id: "characterai",
  name: "Character.AI",
  domains: ["character.ai", "beta.character.ai"],
  containerSelectors: ['[class*="chat-messages"]', "main"],
  assistantMessageSelectors: ['[class*="message-char"]', '[data-testid="char-message"]'],
  userMessageSelectors: ['[class*="message-human"]', '[data-testid="human-message"]'],
  defaultModel: "Character.AI default model"
});
