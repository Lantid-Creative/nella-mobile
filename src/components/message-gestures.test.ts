import { describe, expect, it } from "vitest";
import { quoteText, toggleReaction } from "./message-gestures";

describe("message reactions and replies", () => {
  it("keeps one reaction per message and removes it on a second tap", () => {
    expect(toggleReaction(undefined, "👍")).toEqual(["👍"]);
    expect(toggleReaction(["👍"], "❤️")).toEqual(["❤️"]);
    expect(toggleReaction(["👍"], "👍")).toEqual([]);
  });
  it("shortens long quoted replies", () => {
    expect(quoteText("a".repeat(200)).length).toBe(90);
    expect(quoteText(undefined)).toBe("Attachment");
  });
});
