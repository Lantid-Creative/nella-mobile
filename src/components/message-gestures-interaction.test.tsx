import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MessageGestures } from "./message-gestures";

describe("mobile swipe completion", () => {
  it("never replies from a canceled swipe but replies from a completed swipe", () => {
    const onReply = vi.fn();
    const { getByText } = render(
      <MessageGestures mine={false} onReply={onReply} onReact={vi.fn()}>
        Hello
      </MessageGestures>,
    );
    const target = getByText("Hello");
    target.setPointerCapture = vi.fn();
    const OriginalPointerEvent = window.PointerEvent;
    class TestPointerEvent extends MouseEvent {
      pointerId = 1;
    }
    window.PointerEvent = TestPointerEvent as typeof PointerEvent;
    try {
      fireEvent.pointerDown(target, { clientX: 0, clientY: 0 });
      fireEvent.pointerMove(target, { clientX: 80, clientY: 0 });
      fireEvent.pointerCancel(target);
      expect(onReply).not.toHaveBeenCalled();
      fireEvent.pointerDown(target, { clientX: 0, clientY: 0 });
      fireEvent.pointerMove(target, { clientX: 80, clientY: 0 });
      fireEvent.pointerUp(target, { clientX: 80, clientY: 0 });
      expect(onReply).toHaveBeenCalledTimes(1);
    } finally {
      window.PointerEvent = OriginalPointerEvent;
    }
  });
});
