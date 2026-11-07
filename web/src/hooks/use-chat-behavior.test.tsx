import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isNearConversationBottom, shouldSendOnEnter, usePendingReply } from "./use-chat-behavior";

afterEach(() => vi.useRealTimers());
describe("mobile conversation behavior", () => {
  it("cancels a pending reply when the conversation is cleared", () => {
    vi.useFakeTimers(); const reply = vi.fn(); const { result } = renderHook(() => usePendingReply());
    act(() => { result.current.schedule(reply, 800); });
    act(() => result.current.cancel());
    act(() => vi.advanceTimersByTime(1000));
    expect(reply).not.toHaveBeenCalled(); expect(result.current.pending).toBe(false);
  });
  it("cancels replies on unmount and refuses overlapping work", () => {
    vi.useFakeTimers(); const reply = vi.fn(); const { result, unmount } = renderHook(() => usePendingReply());
    act(() => { expect(result.current.schedule(reply, 800)).toBe(true); expect(result.current.schedule(reply, 800)).toBe(false); });
    unmount(); act(() => vi.advanceTimersByTime(1000)); expect(reply).not.toHaveBeenCalled();
  });
  it("does not follow the bottom while the customer reads history", () => {
    expect(isNearConversationBottom({ scrollHeight: 2000, scrollTop: 200, clientHeight: 600 })).toBe(false);
    expect(isNearConversationBottom({ scrollHeight: 2000, scrollTop: 1400, clientHeight: 600 })).toBe(true);
  });
  it("keeps IME confirmation and touch Enter from sending a message", () => {
    const enter = { key: "Enter", shiftKey: false, isComposing: false };
    expect(shouldSendOnEnter({ ...enter, isComposing: true }, false)).toBe(false);
    expect(shouldSendOnEnter(enter, true)).toBe(false);
    expect(shouldSendOnEnter(enter, false)).toBe(true);
  });
});