import { useEffect, useRef, useState } from "react";

export function usePendingReply() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const cancel = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    busy.current = false;
    setPending(false);
  };
  const schedule = (callback: () => void, delay: number) => {
    if (busy.current) return false;
    busy.current = true;
    setPending(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      busy.current = false;
      try {
        callback();
      } finally {
        setPending(false);
      }
    }, delay);
    return true;
  };
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
      busy.current = false;
    },
    [],
  );
  return { pending, busy, schedule, cancel };
}

export function isNearConversationBottom(
  element: Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">,
) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 96;
}

export function shouldSendOnEnter(
  event: { key: string; shiftKey: boolean; isComposing: boolean },
  touchInput: boolean,
) {
  return event.key === "Enter" && !event.shiftKey && !event.isComposing && !touchInput;
}
