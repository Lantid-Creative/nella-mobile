import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useServiceNavigation } from "./use-service-navigation";

describe("mobile profile navigation", () => {
  it("returns from account and funding to profile, then back to chat", async () => {
    const { result, unmount } = renderHook(() => useServiceNavigation());
    act(() => result.current.setMenu(true));
    act(() => result.current.change("account"));
    expect(result.current.menu).toBe(false);
    expect(result.current.panel).toBe("account");
    act(() => result.current.back());
    await waitFor(() => expect(result.current.menu).toBe(true));
    expect(result.current.panel).toBeNull();
    act(() => result.current.back());
    await waitFor(() => expect(result.current.menu).toBe(false));
    expect(result.current.panel).toBeNull();
    unmount();
  });
});
