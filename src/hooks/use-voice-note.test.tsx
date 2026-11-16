import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useVoiceNote } from "./use-voice-note";

afterEach(() => vi.restoreAllMocks());
describe("voice interruption safety", () => {
  it("does not publish a review after an active recording is unmounted", async () => {
    const track = { stop: vi.fn(), addEventListener: vi.fn() };
    let active: { onstop?: () => void; state: string; stop: () => void } | undefined;
    const createUrl = vi.fn();
    vi.stubGlobal(
      "MediaRecorder",
      class {
        static isTypeSupported() {
          return true;
        }
        state = "inactive";
        mimeType = "audio/webm";
        onstop?: () => void;
        constructor(public stream: MediaStream) {
          // The test needs the instance the hook created, so it can fire the
          // recorder's stop callback.
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          active = this;
        }
        start() {
          this.state = "recording";
        }
        stop() {
          this.state = "inactive";
        }
      },
    );
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createUrl });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => ({ getTracks: () => [track], getAudioTracks: () => [track] }),
      },
    });
    const { result, unmount } = renderHook(() => useVoiceNote(vi.fn()));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.mode).toBe("recording");
    unmount();
    active?.onstop?.();
    expect(track.stop).toHaveBeenCalled();
    expect(createUrl).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
  it("stops a microphone granted after the gesture has been cancelled", async () => {
    let resolve: (stream: MediaStream) => void = () => undefined;
    const track = { stop: vi.fn() };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () =>
          new Promise<MediaStream>((done) => {
            resolve = done;
          }),
      },
    });
    vi.stubGlobal("MediaRecorder", class {});
    const { result } = renderHook(() => useVoiceNote(vi.fn()));
    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.start();
    });
    act(() => result.current.discard());
    await act(async () => {
      resolve({ getTracks: () => [track] } as unknown as MediaStream);
      await pending;
    });
    expect(track.stop).toHaveBeenCalledOnce();
    expect(result.current.mode).toBe("idle");
    vi.unstubAllGlobals();
  });
  it("cancels a pending permission request when the page is hidden", async () => {
    let resolve: (stream: MediaStream) => void = () => undefined;
    const track = { stop: vi.fn() };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () =>
          new Promise<MediaStream>((done) => {
            resolve = done;
          }),
      },
    });
    vi.stubGlobal("MediaRecorder", class {});
    const { result } = renderHook(() => useVoiceNote(vi.fn()));
    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.start();
    });
    act(() => window.dispatchEvent(new Event("pagehide")));
    await act(async () => {
      resolve({ getTracks: () => [track] } as unknown as MediaStream);
      await pending;
    });
    expect(track.stop).toHaveBeenCalledOnce();
    expect(result.current.mode).toBe("idle");
    vi.unstubAllGlobals();
  });
});
