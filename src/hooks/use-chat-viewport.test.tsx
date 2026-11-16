import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useChatViewport } from "./use-chat-viewport";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("chat keyboard viewport", () => {
  it("follows both keyboard resizing and viewport panning, then cleans up", () => {
    const viewport = Object.assign(new EventTarget(), { height: 852, offsetTop: 0, scale: 1 });
    vi.stubGlobal("visualViewport", viewport);
    vi.stubGlobal("innerHeight", 852);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const element = { scrollHeight: 1800, scrollTop: 0 } as HTMLElement;
    const follows = { current: true };
    const { unmount } = renderHook(() => useChatViewport({ current: element }, follows));
    act(() => {
      viewport.height = 430;
      viewport.offsetTop = 180;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(document.documentElement.style.getPropertyValue("--app-height")).toBe("430px");
    expect(document.documentElement.style.getPropertyValue("--app-top")).toBe("180px");
    expect(element.scrollTop).toBe(1800);
    follows.current = false;
    element.scrollTop = 200;
    act(() => {
      viewport.offsetTop = 220;
      viewport.dispatchEvent(new Event("scroll"));
    });
    expect(document.documentElement.style.getPropertyValue("--app-top")).toBe("220px");
    expect(element.scrollTop).toBe(200);
    act(() => {
      viewport.height = 852;
      viewport.offsetTop = 0;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(document.documentElement.hasAttribute("data-chat-keyboard")).toBe(false);
    unmount();
    expect(document.documentElement.hasAttribute("data-chat-open")).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--app-height")).toBe("");
  });
  it("uses the window height without VisualViewport support", () => {
    vi.stubGlobal("visualViewport", undefined);
    vi.stubGlobal("innerHeight", 650);
    const { unmount } = renderHook(() => useChatViewport({ current: null }, { current: false }));
    expect(document.documentElement.style.getPropertyValue("--app-height")).toBe("650px");
    expect(document.documentElement.style.getPropertyValue("--app-top")).toBe("0px");
    unmount();
  });
});
