import { createDomAdapter } from "../shared/domAdapterFactory.js";

/**
 * Poe (poe.com). Poe hosts many underlying models under one UI; the model
 * name shown in the page chrome is used as-is (e.g. "GPT-4o", "Claude-3-Opus")
 * so it maps into the same tier heuristics as the native provider apps.
 */
export const poeAdapter = createDomAdapter({
  id: "poe",
  name: "Poe",
  domains: ["poe.com"],
  containerSelectors: ['[class*="ChatMessagesView"]', "main"],
  assistantMessageSelectors: ['[class*="Message_botMessageBubble"]', '[author-role="bot"]'],
  userMessageSelectors: ['[class*="Message_humanMessageBubble"]', '[author-role="human"]'],
  modelSelector: '[class*="ChatPageMainFooter_botName"]',
  defaultModel: "Poe default bot"
});
