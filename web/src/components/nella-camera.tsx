import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, ZoomIn, ZoomOut } from "lucide-react";

type Props = {
  onCapture: (file: File, url: string) => void;
  onClose: () => void;
  onFallback: () => void;
};

type ZoomRange = { min: number; max: number; step: number };

const DIGITAL_RANGE: ZoomRange = { min: 1, max: 3, step: 0.1 };

export function NellaCamera({ onCapture, onClose, onFallback }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  const zoomRef = useRef(1);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [nativeZoom, setNativeZoom] = useState<ZoomRange | null>(null);
  const [zoom, setZoom] = useState(1);
  const [capturing, setCapturing] = useState(false);

  const range = nativeZoom ?? DIGITAL_RANGE;

  const applyZoom = useCallback(
    (value: number) => {
      const clamped = Math.min(range.max, Math.max(range.min, value));
      zoomRef.current = clamped;
      setZoom(clamped);
      const track = trackRef.current;
      if (nativeZoom && track) {
        track.applyConstraints({ advanced: [{ zoom: clamped } as MediaTrackConstraintSet] }).catch(() => {});
      }
    },
    [nativeZoom, range.max, range.min],
  );

  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setFailed(true);
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        trackRef.current = track ?? null;
        const capabilities = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { zoom?: ZoomRange };
        if (capabilities.zoom && capabilities.zoom.max > capabilities.zoom.min) {
          setNativeZoom({ min: capabilities.zoom.min, max: capabilities.zoom.max, step: capabilities.zoom.step || 0.1 });
          zoomRef.current = capabilities.zoom.min;
          setZoom(capabilities.zoom.min);
        }
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().then(() => setReady(true)).catch(() => setFailed(true));
        }
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      trackRef.current = null;
    };
  }, []);

  const pinchDistance = () => {
    const [a, b] = [...pointersRef.current.values()];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2) {
      pinchStartRef.current = { distance: pinchDistance(), zoom: zoomRef.current };
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const start = pinchStartRef.current;
    if (pointersRef.current.size === 2 && start && start.distance > 0) {
      applyZoom(start.zoom * (pinchDistance() / start.distance));
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || capturing) return;
    setCapturing(true);
    const digital = nativeZoom ? 1 : zoomRef.current;
    const sourceWidth = video.videoWidth / digital;
    const sourceHeight = video.videoHeight / digital;
    const sx = (video.videoWidth - sourceWidth) / 2;
    const sy = (video.videoHeight - sourceHeight) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sourceWidth);
    canvas.height = Math.round(sourceHeight);
    const context = canvas.getContext("2d");
    if (!context) {
      setCapturing(false);
      return;
    }
    context.drawImage(video, sx, sy, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        setCapturing(false);
        if (!blob) return;
        const file = new File([blob], `nella-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file, URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92,
    );
  };

  const digitalScale = nativeZoom ? 1 : zoom;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" role="dialog" aria-modal="true" aria-label="Take a payment photo">
      <div className="flex items-center justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <p className="text-sm font-semibold">Snap to pay</p>
        <Button variant="plain" size="none" type="button" onClick={onClose} aria-label="Close camera" className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-accent">
          <X className="h-5 w-5" />
        </Button>
      </div>
      {failed ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Camera className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            The in-app camera isn’t available here. You can use your phone’s camera instead — it has its own zoom.
          </p>
          <Button type="button" className="min-h-11" onClick={onFallback}>
            Open phone camera
          </Button>
          <Button variant="plain" size="none" type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-semibold hover:bg-accent">
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <div
            className="relative flex-1 touch-none overflow-hidden bg-foreground/5"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              aria-label="Camera preview"
              className="h-full w-full object-cover transition-transform duration-100"
              style={{ transform: `scale(${digitalScale})` }}
            />
            {!ready && <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Starting camera…</p>}
          </div>
          <div className="flex items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={range.step}
              value={zoom}
              onChange={(e) => applyZoom(Number(e.target.value))}
              aria-label="Camera zoom"
              className="min-h-11 flex-1 accent-[var(--primary)]"
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="w-10 shrink-0 text-center text-xs font-semibold text-muted-foreground">{zoom.toFixed(1)}×</span>
            <Button
              type="button"
              onClick={capture}
              disabled={!ready || capturing}
              aria-label="Capture photo"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
            >
              <Camera className="h-6 w-6" />
            </Button>
          </div>
          <p className="px-4 pb-2 text-center text-[11px] text-muted-foreground">Pinch or use the slider to zoom in on the payment details.</p>
        </>
      )}
    </div>
  );
}
