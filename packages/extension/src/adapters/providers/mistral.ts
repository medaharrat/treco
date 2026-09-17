import { createDomAdapter } from "../shared/domAdapterFactory.js";

/** Mistral AI's Le Chat (chat.mistral.ai). */
export const mistralAdapter = createDomAdapter({
  id: "mistral",
  name: "Le Chat",
  domains: ["chat.mistral.ai"],
  containerSelectors: ["main", '[role="main"]'],
  assistantMessageSelectors: ['[data-message-role="assistant"]', ".message-assistant"],
  userMessageSelectors: ['[data-message-role="user"]', ".message-user"],
  defaultModel: "Le Chat default model"
});
