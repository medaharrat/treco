import {
  buildUsageEvent,
  estimateTokensFromCharCount,
  estimateTokensFromText,
  inferredTurnEstimate,
  type AIProviderAdapter,
  type ProviderId,
  type UsageEvent
} from "@ai-footprint/core";

/**
 * Configuration for a DOM-observation-based provider adapter. Each provider
 * file supplies one of these; all the resilience/observation machinery lives
 * once, here, instead of being duplicated per provider.
 *
 * Selectors are a *best-effort, first line of defense* - consumer web apps
 * change their markup without notice. Every adapter therefore also falls
 * back to a structure-agnostic "quiet period" heuristic (see
 * handleQuietPeriod below) that keeps working even when every selector below
 * goes stale, at the cost of losing the input/output token split.
 */
export interface DomAdapterConfig {
  id: ProviderId;
  name: string;
  domains: string[];
  /** Candidate selectors for the scrollable conversation container, tried in order. */
  containerSelectors: string[];
  /** Candidate selectors identifying a completed assistant/response message node. */
  assistantMessageSelectors: string[];
  /** Candidate selectors identifying a user message node. */
  userMessageSelectors: string[];
  /** Optional selector for reading the currently active model name from page chrome. */
  modelSelector?: string;
  defaultModel: string;
  /** How long content must stop changing before we treat a turn as finished streaming. */
  settleDelayMs?: number;
}

const DEFAULT_SETTLE_DELAY_MS = 1200;
const GENERIC_DELTA_THRESHOLD_CHARS = 24;
const GENERIC_DELTA_CAP_CHARS = 20_000;

function findPrecedingUserMessage(container: Element, assistantNode: Element, userSelectors: string[]): Element | null {
  for (const sel of userSelectors) {
    let candidate: Element | null = null;
    let nodes: Element[];
    try {
      nodes = Array.from(container.querySelectorAll(sel));
    } catch {
      continue;
    }
    for (const node of nodes) {
      const position = node.compareDocumentPosition(assistantNode);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        candidate = node;
      } else {
        break;
      }
    }
    if (candidate) return candidate;
  }
  return null;
}

function firstMatch(selectors: string[]): Element | null {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el) return el;
    } catch {
      // Invalid/unsupported selector on this page - try the next candidate.
    }
  }
  return null;
}

export function createDomAdapter(config: DomAdapterConfig): AIProviderAdapter {
  const settleDelayMs = config.settleDelayMs ?? DEFAULT_SETTLE_DELAY_MS;
  const processed = new WeakSet<Element>();
  let container: Element | null = null;
  let observer: MutationObserver | null = null;
  let quietTimer: ReturnType<typeof setTimeout> | null = null;
  let lastGenericLength = 0;

  function detect(): boolean {
    return config.domains.includes(location.hostname);
  }

  function currentModel(): string {
    if (config.modelSelector) {
      try {
        const text = document.querySelector(config.modelSelector)?.textContent?.trim();
        if (text) return text.slice(0, 80);
      } catch {
        // fall through to default
      }
    }
    return config.defaultModel;
  }

  function resolveContainer(): Element {
    return firstMatch(config.containerSelectors) ?? document.body;
  }

  function buildCandidateEvent(input: {
    inputTokens: number;
    outputTokens: number;
    tokenMethod: "estimated" | "inferred" | "exact";
  }): UsageEvent {
    return buildUsageEvent({
      provider: config.id,
      model: currentModel(),
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      tokenMethod: input.tokenMethod
    });
  }

  function scanStructured(emit: (event: UsageEvent | null) => void): boolean {
    if (!container) return false;
    let foundAny = false;

    for (const sel of config.assistantMessageSelectors) {
      let nodes: Element[];
      try {
        nodes = Array.from(container.querySelectorAll(sel));
      } catch {
        continue;
      }
      if (nodes.length > 0) foundAny = true;

      for (const node of nodes) {
        if (processed.has(node)) continue;
        processed.add(node);

        const outputText = node.textContent ?? "";
        if (outputText.trim().length === 0) continue;
        const outputEstimate = estimateTokensFromText(outputText);

        const userNode = findPrecedingUserMessage(container, node, config.userMessageSelectors);
        const inputText = userNode?.textContent ?? "";
        const inputEstimate = inputText.trim().length > 0 ? estimateTokensFromText(inputText) : null;

        emit(
          buildCandidateEvent({
            inputTokens: inputEstimate?.tokens ?? inferredTurnEstimate().inputTokens,
            outputTokens: outputEstimate.tokens,
            tokenMethod: inputEstimate ? "estimated" : "inferred"
          })
        );
      }
    }

    return foundAny || config.assistantMessageSelectors.length > 0;
  }

  /**
   * Structure-agnostic fallback: measure total rendered text growth in the
   * container since the last check. Used when structured selectors are not
   * configured, or configured but matching nothing (e.g. after a site
   * redesign). Always tagged "inferred" and always attributes the whole
   * delta to output tokens with a fixed small input estimate, since we
   * cannot reliably separate prompt from response this way.
   */
  function scanGeneric(emit: (event: UsageEvent | null) => void) {
    if (!container) return;
    const text = container.textContent ?? "";
    const delta = text.length - lastGenericLength;
    lastGenericLength = text.length;

    if (delta > GENERIC_DELTA_THRESHOLD_CHARS) {
      const capped = Math.min(delta, GENERIC_DELTA_CAP_CHARS);
      const estimate = estimateTokensFromCharCount(capped);
      emit(
        buildCandidateEvent({
          inputTokens: inferredTurnEstimate().inputTokens,
          outputTokens: estimate.tokens,
          tokenMethod: "inferred"
        })
      );
    }
  }

  function handleQuietPeriod(emit: (event: UsageEvent | null) => void) {
    const structuredConfigured = scanStructured(emit);
    if (!structuredConfigured) {
      scanGeneric(emit);
    }
  }

  return {
    id: config.id,
    name: config.name,
    domains: config.domains,
    detect,
    observe(emit: (event: UsageEvent | null) => void) {
      container = resolveContainer();
      lastGenericLength = container.textContent?.length ?? 0;

      observer = new MutationObserver(() => {
        if (quietTimer) clearTimeout(quietTimer);
        quietTimer = setTimeout(() => handleQuietPeriod(emit), settleDelayMs);
      });
      observer.observe(container, { childList: true, subtree: true, characterData: true });
    },
    disconnect() {
      observer?.disconnect();
      observer = null;
      if (quietTimer) {
        clearTimeout(quietTimer);
        quietTimer = null;
      }
    },
    extractUsage(): UsageEvent | null {
      // One-shot extraction used by tests against static fixtures: no
      // debouncing, just a direct structured-then-generic scan.
      container = resolveContainer();
      let result: UsageEvent | null = null;
      const emit = (event: UsageEvent | null) => {
        if (event) result = event;
      };
      const structuredConfigured = scanStructured(emit);
      if (!structuredConfigured || !result) {
        lastGenericLength = 0;
        scanGeneric(emit);
      }
      return result;
    }
  };
}
