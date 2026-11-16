import { useEffect, type RefObject } from "react";

/** Keep chat in the visible viewport; iOS can pan it as well as resize it. */
export function useChatViewport(
  conversation: RefObject<HTMLElement | null>,
  followsBottom: RefObject<boolean>,
) {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      // Do not counteract the customer's pinch-to-zoom accessibility gesture.
      const unzoomed = !viewport || viewport.scale === 1;
      root.style.setProperty(
        "--app-height",
        `${unzoomed && viewport ? viewport.height : window.innerHeight}px`,
      );
      root.style.setProperty("--app-top", `${unzoomed && viewport ? viewport.offsetTop : 0}px`);
      const keyboardOpen = unzoomed && !!viewport && window.innerHeight - viewport.height > 120;
      root.toggleAttribute("data-chat-keyboard", keyboardOpen);
      if (followsBottom.current && conversation.current) {
        conversation.current.scrollTop = conversation.current.scrollHeight;
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    root.setAttribute("data-chat-open", "");
    update();
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.removeAttribute("data-chat-open");
      root.removeAttribute("data-chat-keyboard");
      root.style.removeProperty("--app-height");
      root.style.removeProperty("--app-top");
    };
  }, [conversation, followsBottom]);
}
