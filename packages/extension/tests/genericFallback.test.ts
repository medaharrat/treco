import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createDomAdapter } from "../src/adapters/shared/domAdapterFactory.js";
import { withHost } from "./harness.js";

/**
 * Verifies the structure-agnostic fallback path: an adapter configured with
 * NO structured selectors (simulating a provider whose markup we don't
 * recognize, or a site redesign that broke every known selector) should
 * still produce a usable, honestly-labeled estimate rather than nothing.
 */
describe("generic (selector-agnostic) fallback", () => {
  const adapter = createDomAdapter({
    id: "chatgpt",
    name: "Test Provider",
    domains: ["example-ai.test"],
    containerSelectors: ["#chat"],
    assistantMessageSelectors: [],
    userMessageSelectors: [],
    defaultModel: "unknown model"
  });

  beforeEach(() => {
    document.body.innerHTML = `<div id="chat">${"This is a reasonably long simulated AI response. ".repeat(20)}</div>`;
  });

  it("still produces an event when no structured selectors are configured", () => {
    withHost("example-ai.test", () => {
      const event = adapter.extractUsage();
      expect(event).not.toBeNull();
      expect(event?.tokenMethod).toBe("inferred");
      expect(event?.outputTokens).toBeGreaterThan(0);
    });
  });

  it("produces nothing for a container with only trivial/no text", () => {
    document.body.innerHTML = `<div id="chat"></div>`;
    withHost("example-ai.test", () => {
      const event = adapter.extractUsage();
      expect(event).toBeNull();
    });
  });
});

/**
 * Regression test for a real bug: once a page has at least one node matching
 * a configured structured selector, that selector keeps matching it forever
 * (the node never leaves the DOM). A later turn whose real content renders
 * somewhere else entirely - e.g. a generated document/canvas/artifact panel,
 * not wrapped in the matched selector - would then silently produce zero
 * events, because the code mistook "this selector has matched *something*,
 * ever" for "this turn was handled," and never fell back to measuring the
 * container's actual text growth. See Claude's Artifacts feature, which is
 * exactly this scenario in production.
 */
describe("structured selectors matching an old node must not suppress the fallback for a new, differently-shaped turn", () => {
  const settleDelayMs = 50;

  const adapter = createDomAdapter({
    id: "claude",
    name: "Test Provider",
    domains: ["example-ai.test"],
    containerSelectors: ["#container"],
    assistantMessageSelectors: ['[data-testid="assistant-message"]'],
    userMessageSelectors: ['[data-testid="user-message"]'],
    defaultModel: "unknown model",
    settleDelayMs
  });

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div id="container">
        <div data-testid="user-message">Hello</div>
        <div data-testid="assistant-message">Hi there, how can I help?</div>
      </div>
    `;
  });

  afterEach(() => {
    adapter.disconnect();
    vi.useRealTimers();
  });

  it("still emits an event for a turn whose content lives outside the matched selector", async () => {
    // No withHost() here: observe() never consults location.hostname (only
    // detect() does), and withHost's synchronous stub/unstub would race an
    // async test body anyway.
    const events: unknown[] = [];
    adapter.observe((event) => {
      if (event) events.push(event);
    });

    // A normal follow-up turn: a new node matching the structured selector.
    // This should be picked up by the structured scan, same as always.
    const container = document.getElementById("container")!;
    const normalReply = document.createElement("div");
    normalReply.setAttribute("data-testid", "assistant-message");
    normalReply.textContent = "Sure, here is a normal reply with enough text to count as real content here.";
    container.appendChild(normalReply);

    // MutationObserver callbacks fire as a microtask, not a timer - flush
    // that microtask queue before advancing the fake debounce timer.
    await Promise.resolve();
    vi.advanceTimersByTime(settleDelayMs + 10);
    // observe() doesn't retroactively scan content present before it was
    // called, so this first mutation cycle sweeps up both the pre-existing
    // assistant-message from initial render and the newly appended one.
    expect(events.length).toBe(2);

    // A turn whose real content renders in a side panel that does NOT match
    // the assistant-message selector at all (simulating an Artifacts pane).
    // The structured selector still matches the two prior assistant-message
    // nodes (they never left the DOM) - the old buggy code treated that as
    // "handled" and skipped the fallback, producing nothing for this turn.
    const sidePanel = document.createElement("div");
    sidePanel.setAttribute("data-skill-file-viewer", "true");
    sidePanel.textContent = "A long generated document that lives entirely outside the chat message list. ".repeat(10);
    container.appendChild(sidePanel);

    await Promise.resolve();
    vi.advanceTimersByTime(settleDelayMs + 10);
    expect(events.length).toBe(3);
    expect((events[2] as { tokenMethod: string }).tokenMethod).toBe("inferred");
  });
});
