import { describe, it, expect, beforeEach } from "vitest";
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
