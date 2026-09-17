import { describe, it, expect } from "vitest";
import { isUsageCandidateMessage, MESSAGE_TYPE_USAGE_CANDIDATE } from "../src/platform/messaging.js";

describe("isUsageCandidateMessage", () => {
  it("accepts a correctly-typed message", () => {
    expect(
      isUsageCandidateMessage({
        type: MESSAGE_TYPE_USAGE_CANDIDATE,
        payload: { provider: "chatgpt", model: "gpt-4o", inputTokens: 1, outputTokens: 1, tokenMethod: "estimated" }
      })
    ).toBe(true);
  });

  it("rejects messages of a different or missing type (e.g. from an unrelated extension/page message)", () => {
    expect(isUsageCandidateMessage({ type: "some-other-message" })).toBe(false);
    expect(isUsageCandidateMessage({})).toBe(false);
    expect(isUsageCandidateMessage(null)).toBe(false);
    expect(isUsageCandidateMessage("hello")).toBe(false);
    expect(isUsageCandidateMessage(42)).toBe(false);
  });
});
