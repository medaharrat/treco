import { createDomAdapter } from "../shared/domAdapterFactory.js";

/** DeepSeek (chat.deepseek.com). */
export const deepseekAdapter = createDomAdapter({
  id: "deepseek",
  name: "DeepSeek",
  domains: ["chat.deepseek.com"],
  containerSelectors: ["#chat-content", "main"],
  assistantMessageSelectors: [".ds-message--assistant", '[class*="assistant"]'],
  userMessageSelectors: [".ds-message--user", '[class*="message"][class*="user"]'],
  defaultModel: "DeepSeek default model"
});
