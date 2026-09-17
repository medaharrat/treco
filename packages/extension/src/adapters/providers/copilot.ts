import { createDomAdapter } from "../shared/domAdapterFactory.js";

/**
 * Microsoft Copilot (copilot.microsoft.com). No stable public message
 * attributes are documented; this adapter is expected to rely mostly on the
 * shared generic quiet-period fallback rather than structured selectors.
 */
export const copilotAdapter = createDomAdapter({
  id: "copilot",
  name: "Microsoft Copilot",
  domains: ["copilot.microsoft.com"],
  containerSelectors: ["main", '[role="main"]'],
  assistantMessageSelectors: ['[data-content="ai-message"]', ".ac-textBlock"],
  userMessageSelectors: ['[data-content="user-message"]'],
  defaultModel: "Copilot default model"
});
