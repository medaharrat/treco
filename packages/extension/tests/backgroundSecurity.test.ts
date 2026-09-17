import { describe, it, expect, vi, beforeEach } from "vitest";

const store: Record<string, unknown> = {};
let capturedListener: ((message: unknown, sender: unknown) => unknown) | null = null;

vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
        remove: vi.fn(async (key: string) => {
          delete store[key];
        })
      }
    },
    runtime: {
      onMessage: {
        addListener: vi.fn((fn: (message: unknown, sender: unknown) => unknown) => {
          capturedListener = fn;
        })
      },
      onInstalled: {
        addListener: vi.fn()
      },
      getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`)
    },
    tabs: {
      create: vi.fn()
    }
  }
}));

// Importing background/index.ts registers the onMessage listener above as a side effect.
await import("../src/background/index.js");

function candidateMessage(overrides: Record<string, unknown> = {}) {
  return {
    type: "aifootprint/usage-candidate",
    payload: {
      provider: "claude",
      model: "claude-sonnet",
      inputTokens: 10,
      outputTokens: 20,
      tokenMethod: "estimated",
      ...overrides
    }
  };
}

async function enableProvider(id: string) {
  store["aifootprint:settings"] = {
    enabledProviders: [id],
    theme: "system",
    units: "metric",
    carbonIntensityOverrideGPerKwh: null,
    onboardingCompleted: true
  };
}

async function dispatch(message: unknown, senderUrl: string | null) {
  if (!capturedListener) throw new Error("background listener was not registered");
  const sender = senderUrl ? { url: senderUrl } : {};
  const result = capturedListener(message, sender);
  if (result && typeof (result as Promise<unknown>).then === "function") {
    await result;
  }
}

describe("security: background enforces provider/domain isolation", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
  });

  it("accepts a candidate whose sender URL matches its claimed provider's domain", async () => {
    await enableProvider("claude");
    await dispatch(candidateMessage(), "https://claude.ai/chat/123");
    const events = store["aifootprint:events"] as unknown[] | undefined;
    expect(events?.length).toBe(1);
  });

  it("rejects a candidate that claims a provider not matching the sender's actual domain", async () => {
    await enableProvider("claude");
    // Sender is really on chatgpt.com, but the message claims to be from claude.
    await dispatch(candidateMessage({ provider: "claude" }), "https://chatgpt.com/c/123");
    const events = store["aifootprint:events"] as unknown[] | undefined;
    expect(events ?? []).toHaveLength(0);
  });

  it("rejects a candidate with no sender URL at all", async () => {
    await enableProvider("claude");
    await dispatch(candidateMessage(), null);
    const events = store["aifootprint:events"] as unknown[] | undefined;
    expect(events ?? []).toHaveLength(0);
  });

  it("rejects a candidate sent from a domain no provider owns", async () => {
    await enableProvider("claude");
    await dispatch(candidateMessage(), "https://not-a-real-ai-site.example/page");
    const events = store["aifootprint:events"] as unknown[] | undefined;
    expect(events ?? []).toHaveLength(0);
  });

  it("still rejects an otherwise-valid message with an unexpected extra field", async () => {
    await enableProvider("claude");
    await dispatch(candidateMessage({ conversationText: "leaked" }), "https://claude.ai/chat/123");
    const events = store["aifootprint:events"] as unknown[] | undefined;
    expect(events ?? []).toHaveLength(0);
  });

  it("does not record usage for a disabled provider even with a valid sender domain", async () => {
    await enableProvider("chatgpt"); // claude is not enabled
    await dispatch(candidateMessage(), "https://claude.ai/chat/123");
    const events = store["aifootprint:events"] as unknown[] | undefined;
    expect(events ?? []).toHaveLength(0);
  });
});
