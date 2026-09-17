import { createDomAdapter } from "../shared/domAdapterFactory.js";

/** Perplexity (perplexity.ai). Answer engine UI mixes search results with generated text. */
export const perplexityAdapter = createDomAdapter({
  id: "perplexity",
  name: "Perplexity",
  domains: ["www.perplexity.ai", "perplexity.ai"],
  containerSelectors: ["main", '[id="__next"] main'],
  assistantMessageSelectors: ['[data-testid="answer-content"]', ".prose"],
  userMessageSelectors: ['[data-testid="query-text"]'],
  defaultModel: "Perplexity default model"
});
