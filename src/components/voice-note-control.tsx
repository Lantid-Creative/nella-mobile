import { useRef, useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VoiceNoteControl({
  mode,
  disabled,
  start,
  stop,
  discard,
}: {
  mode: string;
  disabled: boolean;
  start: () => void;
  stop: () => void;
  discard: () => void;
}) {
  const origin = useRef<number | null>(null);
  const cancelled = useRef(false);
  const pointerUsed = useRef(false);
  const [sliding, setSliding] = useState(false);
  return (
    <Button
      variant="plain"
      size="none"
      type="button"
      disabled={disabled || mode === "review"}
      aria-label={mode === "recording" ? "Stop voice recording" : "Record a voice note"}
      title="Record a voice note"
      className={`flex h-11 w-11 shrink-0 touch-none select-none items-center justify-center rounded-full disabled:opacity-40 ${mode === "recording" || sliding ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}
      onPointerDown={(event) => {
        if (event.button !== 0 || mode !== "idle") return;
        pointerUsed.current = true;
        origin.current = event.clientX;
        cancelled.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
        start();
      }}
      onPointerMove={(event) => {
        if (origin.current === null) return;
        if (origin.current - event.clientX >= 72 && !cancelled.current) {
          cancelled.current = true;
          setSliding(true);
          discard();
        }
      }}
      onPointerUp={() => {
        if (origin.current !== null && !cancelled.current) stop();
        origin.current = null;
        setSliding(false);
      }}
      onPointerCancel={() => {
        origin.current = null;
        setSliding(false);
        discard();
      }}
      onClick={() => {
        if (pointerUsed.current) {
          pointerUsed.current = false;
          return;
        }
        if (mode === "recording") stop();
        else start();
      }}
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
}
