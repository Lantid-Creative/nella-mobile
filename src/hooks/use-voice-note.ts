import { useEffect, useRef, useState } from "react";

export function useVoiceNote(onNotice: (message: string) => void) {
  const [mode, setMode] = useState<"idle" | "starting" | "recording" | "review">("idle");
  const [url, setUrl] = useState("");
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const generation = useRef(0);
  const started = useRef(0);
  const preview = useRef("");
  const discarded = useRef(false);
  const notice = useRef(onNotice);
  notice.current = onNotice;
  const discard = () => {
    generation.current++;
    discarded.current = true;
    const active = recorder.current;
    if (active && active.state !== "inactive") active.stop();
    active?.stream.getTracks().forEach(track => track.stop());
    recorder.current = null;
    if (preview.current) URL.revokeObjectURL(preview.current);
    preview.current = "";
    setUrl(""); setSeconds(0); setMode("idle");
  };
  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    else if (!recorder.current) discard();
  };
  const start = async () => {
    if (recorder.current || mode !== "idle") return;
    const token = ++generation.current;
    setMode("starting"); notice.current("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMode("idle"); notice.current("Voice recording isn’t available in this browser."); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (token !== generation.current || document.hidden) { stream.getTracks().forEach(track => track.stop()); return; }
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(type => MediaRecorder.isTypeSupported(type));
      const active = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.current = active; discarded.current = false;
      const chunks: Blob[] = [];
      active.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      active.onerror = () => { discard(); notice.current("Recording interrupted. Please record again."); };
      stream.getAudioTracks().forEach(track => track.addEventListener("ended", () => { if (active.state === "recording") { discard(); notice.current("Microphone disconnected. Please record again."); } }));
      active.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        if (token !== generation.current || discarded.current) return;
        recorder.current = null;
        const blob = new Blob(chunks, { type: active.mimeType || "audio/webm" });
        if (!blob.size) { setMode("idle"); notice.current("No audio was recorded. Please try again."); return; }
        preview.current = URL.createObjectURL(blob);
        setUrl(preview.current); setSeconds(Math.max(1, Math.floor((Date.now() - started.current) / 1000))); setMode("review");
      };
      started.current = Date.now(); setSeconds(0); active.start(); setMode("recording");
    } catch {
      recorder.current?.stream.getTracks().forEach(track => track.stop());
      if (token !== generation.current) return;
      setMode("idle"); notice.current("Couldn’t use the microphone. Check permission in your browser settings and try again.");
    }
  };
  useEffect(() => {
    if (mode !== "recording") return;
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started.current) / 1000)), 250);
    return () => clearInterval(timer);
  }, [mode]);
  useEffect(() => {
    const interrupt = () => {
      if (recorder.current || mode === "starting") { discard(); notice.current("Recording cancelled when you left Nella. Please record again."); }
    };
    const visibility = () => { if (document.hidden) interrupt(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", interrupt);
    return () => { document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", interrupt); };
  }, [mode]);
  useEffect(() => () => { generation.current++; discarded.current = true; const active = recorder.current; if (active && active.state !== "inactive") active.stop(); active?.stream.getTracks().forEach(track => track.stop()); if (preview.current) URL.revokeObjectURL(preview.current); }, []);
  const take = () => { const result = { url, seconds }; preview.current = ""; setUrl(""); setSeconds(0); setMode("idle"); return result; };
  return { mode, url, seconds, start, stop, discard, take };
}