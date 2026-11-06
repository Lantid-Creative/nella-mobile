import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useVoiceNote } from "./use-voice-note";

afterEach(() => vi.restoreAllMocks());
describe("voice interruption safety", () => {
  it("stops a microphone granted after the gesture has been cancelled", async () => {
    let resolve: (stream: MediaStream) => void = () => undefined;
    const track = { stop: vi.fn() };
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: () => new Promise<MediaStream>(done => { resolve = done; }) } });
    vi.stubGlobal("MediaRecorder", class {});
    const { result } = renderHook(() => useVoiceNote(vi.fn()));
    let pending: Promise<void> | undefined;
    act(() => { pending = result.current.start(); });
    act(() => result.current.discard());
    await act(async () => { resolve({ getTracks: () => [track] } as unknown as MediaStream); await pending; });
    expect(track.stop).toHaveBeenCalledOnce();
    expect(result.current.mode).toBe("idle");
    vi.unstubAllGlobals();
  });
  it("cancels a pending permission request when the page is hidden", async () => {
    let resolve: (stream: MediaStream) => void = () => undefined;
    const track = { stop: vi.fn() };
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: () => new Promise<MediaStream>(done => { resolve = done; }) } });
    vi.stubGlobal("MediaRecorder", class {});
    const { result } = renderHook(() => useVoiceNote(vi.fn()));
    let pending: Promise<void> | undefined;
    act(() => { pending = result.current.start(); });
    act(() => window.dispatchEvent(new Event("pagehide")));
    await act(async () => { resolve({ getTracks: () => [track] } as unknown as MediaStream); await pending; });
    expect(track.stop).toHaveBeenCalledOnce();
    expect(result.current.mode).toBe("idle");
    vi.unstubAllGlobals();
  });
});