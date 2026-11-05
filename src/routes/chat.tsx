import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeftRight,
  ArrowUp,
  ArrowDown,
  Bell,
  CalendarClock,
  Camera,
  ChevronRight,
  CircleHelp,
  History,
  ImagePlus,
  LogOut,
  Mic,
  Plus,
  ReceiptText,
  RotateCcw,
  Shield,
  Smartphone,
  UsersRound,
  X,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  currentUser,
  canEnterChat,
  demoReply,
  loadChat,
  naira,
  saveChat,
  signOut,
  type ApprovalCard,
  type ChatMedia,
  type ChatMsg,
  type DemoUser,
} from "@/lib/demo-store";
import { Button } from "@/components/ui/button";
import { NellaMascot } from "@/components/nella-mascot";
import { NellaCamera } from "@/components/nella-camera";
import { PaymentApproval } from "@/components/payment-approval";
import { NellaServices, PaymentPreviewCard } from "@/components/nella-services";
import { panelForMessage, paymentPreview, type AppPanel, type ReceiptPreview } from "@/lib/app-provisions";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePendingReply, isNearConversationBottom, shouldSendOnEnter } from "@/hooks/use-chat-behavior";
import { useServiceNavigation } from "@/hooks/use-service-navigation";
import { STORAGE_NOTICE } from "@/lib/demo-storage";
import { answerPayment, startPayment, paymentService, type PaymentConversation } from "@/lib/chat-payments";
import { SERVICE_LABELS, type PaymentDraft } from "@/lib/app-provisions";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat with Nella" },
      {
        name: "description",
        content:
          "Send money, buy airtime and data, pay bills and check your balance by chatting with Nella.",
      },
      { property: "og:title", content: "Chat with Nella" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content:
          "Send money, buy airtime and data, pay bills and check your balance by chatting with Nella.",
      },
    ],
  }),
  component: ChatPage,
});

const NARRATIONS = ["Rent", "Food", "Family", "Business"];
const uid = () => crypto.randomUUID();

type QuickAction = {
  label: string;
  prompt: string;
  icon: LucideIcon;
  attachment?: boolean;
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Snap to pay", prompt: "", icon: Camera, attachment: true },
  {
    label: "Balance",
    prompt: "Check my balance",
    icon: Wallet,
  },
  {
    label: "Send money",
    prompt: "Send money",
    icon: ArrowLeftRight,
  },
  {
    label: "Buy airtime",
    prompt: "Buy airtime",
    icon: Smartphone,
  },
  {
    label: "Pay a bill",
    prompt: "Pay a bill",
    icon: ReceiptText,
  },
];

function ChatPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const reply = usePendingReply();
  const typing = reply.pending;
  const [menu, setMenu] = useState(false);
  const { panel, change: changePanel, back: panelBack, depth: panelDepth } = useServiceNavigation();
  const [payment, setPayment] = useState<PaymentConversation | null>(null);
  const [approval, setApproval] = useState<PaymentConversation | null>(null);
  const [chatChoices, setChatChoices] = useState<string[]>([]);
  const setPanel = (next: AppPanel | null) => {
    if (next && (next in SERVICE_LABELS || next === "services")) {
      changePanel(null);
      send(next === "services" ? "All money services" : SERVICE_LABELS[next as keyof typeof SERVICE_LABELS]);
    } else changePanel(next);
  };
  const [newMessages, setNewMessages] = useState(false);
  const [visibleCount, setVisibleCount] = useState(40);
  const scrollRef = useRef<HTMLElement>(null);
  const followsBottom = useRef(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState("");
  const [photoMenu, setPhotoMenu] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<{ file: File; url: string } | null>(null);
  const [voiceMode, setVoiceMode] = useState<"idle" | "recording" | "review">("idle");
  const [voiceUrl, setVoiceUrl] = useState("");
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const msgsRef = useRef<ChatMsg[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingFailedRef = useRef(false);
  const recordingStartRef = useRef(0);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const u = currentUser();
    if (!u || !canEnterChat(u)) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    setUser(u);
    const m = loadChat(u.phone);
    msgsRef.current = m;
    setMsgs(m);
  }, [navigate]);
  useEffect(() => {
    const warning = () => setNotice(STORAGE_NOTICE);
    window.addEventListener("nella-storage-warning", warning);
    const connection = () => { if (!navigator.onLine) setNotice("You’re offline. No payment requests will be sent."); };
    window.addEventListener("offline", connection);
    return () => { window.removeEventListener("nella-storage-warning", warning); window.removeEventListener("offline", connection); };
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${height}px`);
    };
    updateHeight();
    window.visualViewport?.addEventListener("resize", updateHeight);
    window.addEventListener("resize", updateHeight);
    return () => {
      window.visualViewport?.removeEventListener("resize", updateHeight);
      window.removeEventListener("resize", updateHeight);
      document.documentElement.style.removeProperty("--app-height");
    };
  }, []);

  useEffect(() => {
    const scrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    if (followsBottom.current) {
      endRef.current?.scrollIntoView({ behavior: scrollBehavior, block: "end" });
      setNewMessages(false);
    } else setNewMessages(true);
  }, [msgs, typing]);

  useEffect(
    () => () => {
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      streamRef.current?.getTracks().forEach((track) => track.stop());
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  useEffect(() => {
    if (voiceMode !== "recording") return;
    const timer = window.setInterval(() => {
      setRecordingSeconds(Math.floor((Date.now() - recordingStartRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [voiceMode]);

  const commit = (next: ChatMsg[]) => {
    msgsRef.current = next;
    setMsgs(next);
    if (user && !saveChat(user.phone, next)) setNotice(STORAGE_NOTICE);
  };
  const nellaSays = (parts: Omit<ChatMsg, "id" | "at" | "role">[], delay = 800) => {
    reply.schedule(() => {
      commit([
        ...msgsRef.current,
        ...parts.map((p) => ({ ...p, id: uid(), role: "nella" as const, at: Date.now() })),
      ]);
    }, delay);
  };
  const patch = (id: string, fn: (m: ChatMsg) => ChatMsg) =>
    commit(msgsRef.current.map((m) => (m.id === id ? fn(m) : m)));

  const send = (raw: string, media?: ChatMedia) => {
    const t = raw.trim();
    if (!t || reply.busy.current || !user) return;
    if (payment?.field === "review" && /^(?:approve(?: payment)?|confirm(?: payment)?|pay now)$/i.test(t)) {
      setText("");
      inputRef.current?.blur();
      setApproval(payment);
      return;
    }
    if (payment?.field === "review" && /^\d{4}$/.test(t)) {
      setText("");
      setNotice("Keep your PIN out of chat. Use Approve payment and enter only your demo PIN there.");
      return;
    }
    followsBottom.current = true;
    commit([
      ...msgsRef.current,
      { id: uid(), role: "user", text: t, ...(media ? { media } : {}), at: Date.now() },
    ]);
    setText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    if (media) {
      nellaSays([{ text: `${media.kind === "image" ? "I can’t read payment details from photos yet." : "Voice transcription isn’t connected yet."} No payment has been made. ${payment ? "Please reply to my last question here in chat." : "What would you like to pay for?"}` }]);
      if (!payment) setChatChoices(Object.values(SERVICE_LABELS));
      return;
    }
    const service = payment && /^\d{10}$/.test(t) ? null : paymentService(t);
    if (service === "services") {
      setPayment(null);
      setChatChoices(Object.values(SERVICE_LABELS));
      nellaSays([{ text: "What would you like to pay for?" }]);
      return;
    }
    const requested = panelForMessage(t);
    if (service || (payment && !requested)) {
      const turn = service && (!payment || service !== payment.draft.service || /^(?:please\s+)?(?:send|transfer|buy|recharge)\b|^(electricity|cable tv)$/i.test(t))
        ? startPayment(service, t, user.name, undefined, user.phone)
        : payment ? answerPayment(payment, t, user.name, user.phone) : null;
      if (turn) {
        setPayment(turn.state);
        setChatChoices(turn.choices ?? []);
        nellaSays([{ text: turn.text, ...(turn.preview ? { card: { kind: "preview" as const, preview: turn.preview } } : {}) }]);
        return;
      }
    }
    setChatChoices([]);
    const requestedPanel = panelForMessage(t);
    if (requestedPanel) {
      inputRef.current?.blur();
      setPanel(requestedPanel);
      return;
    }
    nellaSays(demoReply(t));
  };

  const runQuickAction = (action: QuickAction) => {
    if (action.attachment) {
      setPhotoMenu(true);
      return;
    }
    send(action.prompt);
  };

  const acceptPhoto = (file: File, url?: string) => {
    setPhotoMenu(false);
    setCameraOpen(false);
    if (!file.type.startsWith("image/")) {
      setNotice("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setNotice("Choose an image under 8 MB.");
      return;
    }
    if (pendingPhoto) URL.revokeObjectURL(pendingPhoto.url);
    const photoUrl = url ?? URL.createObjectURL(file);
    objectUrlsRef.current.push(photoUrl);
    setPendingPhoto({ file, url: photoUrl });
    setNotice("");
  };

  const selectPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) acceptPhoto(file);
  };

  const clearPhoto = () => {
    if (pendingPhoto) URL.revokeObjectURL(pendingPhoto.url);
    setPendingPhoto(null);
  };

  const startVoiceRecording = async () => {
    setNotice("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice(
        "Voice recording isn’t supported in this browser. Try a current browser over HTTPS.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recordingFailedRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        recordingFailedRef.current = true;
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setVoiceMode("idle");
        setNotice("The recording stopped unexpectedly. Please try again.");
      };
      recorder.onstop = () => {
        if (recordingFailedRef.current) {
          chunksRef.current = [];
        } else {
          const type = recorder.mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type });
          if (!blob.size) {
            setVoiceMode("idle");
            setNotice("No audio was recorded. Please try again.");
          } else {
            const url = URL.createObjectURL(blob);
            objectUrlsRef.current.push(url);
            setVoiceUrl(url);
            setVoiceDuration(
              Math.max(1, Math.floor((Date.now() - recordingStartRef.current) / 1000)),
            );
            setVoiceMode("review");
          }
        }
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
      };
      recorderRef.current = recorder;
      recordingStartRef.current = Date.now();
      setRecordingSeconds(0);
      recorder.start();
      setVoiceMode("recording");
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone access was denied. Allow it in your browser settings to record a note."
          : "Couldn’t start recording. Check your microphone and try again.";
      setNotice(message);
    }
  };

  const stopVoiceRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const discardVoiceRecording = () => {
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    setVoiceUrl("");
    setVoiceDuration(0);
    setVoiceMode("idle");
  };

  const sendPhoto = () => {
    if (!pendingPhoto) return;
    const media: ChatMedia = {
      kind: "image",
      label: pendingPhoto.file.name,
      previewUrl: pendingPhoto.url,
    };
    send("Payment photo", media);
    setPendingPhoto(null);
  };

  const sendVoice = () => {
    if (!voiceUrl) return;
    const media: ChatMedia = {
      kind: "audio",
      label: "Voice note",
      previewUrl: voiceUrl,
      durationSeconds: voiceDuration,
    };
    send("Voice note", media);
    setVoiceUrl("");
    setVoiceDuration(0);
    setVoiceMode("idle");
  };

  const pickNarration = (msgId: string, pending: ApprovalCard, choice: string | null) => {
    if (reply.busy.current) return;
    patch(msgId, (m) =>
      m.card?.kind === "narration" ? { ...m, card: { ...m.card, done: true } } : m,
    );
    if (choice)
      commit([...msgsRef.current, { id: uid(), role: "user", text: choice, at: Date.now() }]);
    nellaSays(
      [
        {
          text: "Please check and approve:",
          card: { ...pending, ...(choice ? { narration: choice } : {}) },
        },
      ],
      500,
    );
  };

  if (!user) return <div className="min-h-screen bg-background" />;
  const previews = msgs.flatMap(message => message.card?.kind === "preview" ? [message.card.preview] : []);
  const keepPreview = (preview: ReceiptPreview) => {
    commit([...msgsRef.current, { id: uid(), role: "nella", at: Date.now(), card: { kind: "preview", preview } }]);
  };
  const first = user.name.split(" ")[0] || "there";
  const empty = msgs.length === 0;

  return (
    <div className="chat-surface mx-auto flex h-[var(--app-height,100dvh)] min-h-0 max-w-3xl flex-col overflow-hidden">
      {approval && approval === payment && <PaymentApproval receipt={paymentPreview(approval.draft, user.name)} user={user} onClose={() => setApproval(null)} onComplete={() => {
        setApproval(null);
        setPayment(null);
        setChatChoices([]);
        nellaSays([{ text: "Demo PIN checked. No payment was submitted and no money moved. Live payment approval is not connected yet." }], 300);
      }} />}
      <header className="relative z-10 grid shrink-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-border bg-card px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex min-w-0 items-center gap-3"><NellaMascot small /><div className="min-w-0"><p className="text-lg font-extrabold text-primary">nella<span className="text-foreground">.</span></p><p className="text-[11px] text-muted-foreground">Your money companion</p></div></div>
        <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground" aria-label="Notifications" title="Notifications" onClick={() => setPanel("notifications")}><Bell /></Button>
        <Button variant="plain" size="none"
          onClick={() => {
            setMenu((m) => !m);
            setConfirmClear(false);
          }}
          aria-label="Profile"
          aria-expanded={menu}
          className="glass flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground hover:bg-accent"
        >
          <span className="text-sm font-bold text-primary">{first.slice(0,1)}</span>
        </Button>
        <Dialog open={menu} onOpenChange={setMenu}>
          <DialogContent className="nella-profile bottom-0 left-0 top-auto max-h-[calc(var(--app-height,100dvh)-1rem)] overflow-y-auto translate-x-0 translate-y-0 rounded-t-2xl p-6 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
            <DialogTitle>Your profile</DialogTitle>
            <DialogDescription>Manage your Nella demo account.</DialogDescription>
            <div className="flex items-start justify-between">
              <div>
                <p className="break-all font-bold">{user.name}</p>
                <p className="text-xs text-muted-foreground">+234 {user.phone}</p>
              </div>
            </div>
            <div className="my-3 h-px bg-border" />
            <ProfileAction icon={Wallet} label="Account & funding" onClick={() => { setMenu(false); setPanel("account"); }} />
            <ProfileAction icon={Shield} label="Complete account setup" onClick={() => { setMenu(false); setPanel("onboarding"); }} />
            <ProfileAction
              icon={History}
              label="Activity & receipts"
              onClick={() => {
                setMenu(false);
                setPanel("activity");
              }}
            />
            <ProfileAction
              icon={UsersRound}
              label="Beneficiaries"
              onClick={() => {
                setMenu(false);
                setPanel("beneficiaries");
              }}
            />
            <ProfileAction
              icon={Shield}
              label="Security & PIN"
              onClick={() => {
                setMenu(false);
                setPanel("security");
              }}
            />
            <ProfileAction
              icon={CircleHelp}
              label="Help & support"
              onClick={() => {
                setMenu(false);
                setPanel("support");
              }}
            />
            <ProfileAction icon={ReceiptText} label="Spending & statements" onClick={() => { setMenu(false); setPanel("insights"); }} />
            <details className="border-t border-border"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">More from Nella</summary><ProfileAction icon={UsersRound} label="Business payments" onClick={() => { setMenu(false); setPanel("business"); }} /><ProfileAction icon={UsersRound} label="Referrals & ambassadors" onClick={() => { setMenu(false); setPanel("referrals"); }} /></details>
            {confirmClear ? (
              <div className="mt-2 rounded-xl bg-muted p-3">
                <p className="text-sm font-semibold">Clear this chat?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This removes the conversation saved in this browser.
                </p>
                <div className="mt-2 flex gap-2">
                  <Button variant="plain" size="none"
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold"
                  >
                    Keep chat
                  </Button>
                  <Button variant="plain" size="none"
                    onClick={() => {
                      reply.cancel();
                      setPayment(null);
                      setChatChoices([]);
                      commit([]);
                      setConfirmClear(false);
                      setMenu(false);
                    }}
                    className="flex-1 rounded-lg bg-destructive py-2 text-xs font-semibold text-destructive-foreground"
                  >
                    Clear chat
                  </Button>
                </div>
              </div>
            ) : (
              <ProfileAction
                icon={RotateCcw}
                label="Clear chat"
                onClick={() => setConfirmClear(true)}
              />
            )}
            <Button variant="plain" size="none"
              onClick={() => {
                reply.cancel();
                if (!signOut()) { setNotice(STORAGE_NOTICE); return; }
                navigate({ to: "/auth", replace: true });
              }}
              className="flex min-h-11 w-full items-center justify-start gap-3 rounded-lg px-2 py-2 text-sm text-destructive hover:bg-accent"
            >
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </DialogContent>
        </Dialog>
      </header>

      <main
        ref={scrollRef}
        onScroll={event => { followsBottom.current = isNearConversationBottom(event.currentTarget); if (followsBottom.current) setNewMessages(false); }}
        className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5"
        onClick={() => setMenu(false)}
      >
        {empty ? (
          <div className="flex min-h-full flex-col items-center justify-center pb-4 pt-5 text-center">
            <NellaMascot className="mb-3 h-36 w-36" />
            <span className="mb-3 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-primary">YOUR MONEY, IN A CHAT</span>
            <h1 className="text-2xl font-extrabold">Hi, {first} <span aria-hidden="true">👋</span></h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">I'm Nella. What can I help you with today?</p>
            <section aria-label="Payment actions" className="mt-6 w-full max-w-sm">
              <div className="grid grid-cols-2 gap-2.5">
                {QUICK_ACTIONS.map((action) => <QuickActionTile key={action.label} action={action} onClick={() => runQuickAction(action)} disabled={typing} />)}
              </div>
            </section>
            <Button variant="ghost" className="mt-2 h-11" onClick={() => void startVoiceRecording()}><Mic />Voice note</Button>
            <Button variant="link" className="mt-2 h-11" onClick={() => setPanel("services")}>All money services<ArrowUp className="rotate-45" /></Button>
            <Button variant="ghost" className="h-11 text-xs text-muted-foreground" onClick={() => setPanel("onboarding")}><Shield />Complete your account setup</Button>
            <p className="mt-3 text-[11px] text-muted-foreground">Preview only · Banking services aren't connected</p>
          </div>
        ) : (
          <div role="log" aria-label="Conversation with Nella" aria-live="polite" className="space-y-5 py-5">
            <p className="text-center text-[11px] text-muted-foreground">Today · Preview conversation</p>
            {msgs.length > visibleCount && <Button variant="outline" className="h-11 w-full" onClick={() => { const element = scrollRef.current; const height = element?.scrollHeight ?? 0; const top = element?.scrollTop ?? 0; followsBottom.current = false; setVisibleCount(count => count + 40); requestAnimationFrame(() => { if (element) element.scrollTop = top + element.scrollHeight - height; }); }}>Earlier messages</Button>}
            {msgs.slice(-visibleCount).map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "nella" && <NellaMascot small className="mr-2 h-7 w-7" />}
                <div className="min-w-0 max-w-[85%] space-y-2">
                  {m.media?.kind === "image" && (
                    <div className="glass overflow-hidden rounded-[20px] border border-border p-2">
                      {m.media.previewUrl ? (
                        <img
                          src={m.media.previewUrl}
                          alt="Payment photo"
                          className="max-h-56 max-w-full rounded-xl object-contain"
                        />
                      ) : (
                        <p className="px-2 py-4 text-sm text-muted-foreground">
                          This photo is no longer available on this device.
                        </p>
                      )}
                      <p className="px-1 pt-1 text-[11px] text-muted-foreground">Photo attached</p>
                    </div>
                  )}
                  {m.media?.kind === "audio" && (
                    <div className="glass rounded-[20px] border border-border p-3">
                      {m.media.previewUrl ? (
                        <audio
                          controls
                          src={m.media.previewUrl}
                          className="max-w-full"
                          aria-label="Voice note"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          This voice note is no longer available on this device.
                        </p>
                      )}
                      <p className="pt-1 text-[11px] text-muted-foreground">Voice note</p>
                    </div>
                  )}
                  {m.text && (
                    <div
                      className={`whitespace-pre-wrap break-words text-[15px] leading-relaxed ${m.role === "user" ? "rounded-[20px] rounded-br-[4px] bg-primary px-4 py-3 text-primary-foreground" : "px-1 py-1 text-foreground"}`}
                    >
                      {m.text}
                    </div>
                  )}
                  {m.card?.kind === "balance" && (
                    <div className="rounded-[28px] bg-primary p-5 text-primary-foreground shadow-glow">
                      <p className="text-xs opacity-80">Nella wallet</p>
                      <p className="mt-1 text-lg font-bold">
                        Your wallet balance is currently unavailable.
                      </p>
                    </div>
                  )}
                  {m.card?.kind === "preview" && <PaymentPreviewCard receipt={m.card.preview} />}
                  {m.card?.kind === "narration" &&
                    !m.card.done &&
                    (() => {
                      const c = m.card;
                      return (
                        <div className="flex flex-wrap gap-2">
                          {NARRATIONS.map((n) => (
                            <Button variant="plain" size="none"
                              key={n}
                              onClick={() => pickNarration(m.id, c.pending, n)}
                              className="glass rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
                            >
                              {n}
                            </Button>
                          ))}
                          <Button variant="plain" size="none"
                            onClick={() => pickNarration(m.id, c.pending, null)}
                            className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                          >
                            Skip
                          </Button>
                        </div>
                      );
                    })()}
                  {m.card?.kind === "approval" && (
                    <div className="glass rounded-[28px] border border-border p-5">
                      <p className="mb-3 rounded-lg bg-muted px-3 py-2 text-[11px] font-semibold leading-relaxed text-foreground">
                        {m.card.service === "transfer"
                          ? "Transfers are currently unavailable."
                          : m.card.service === "airtime"
                            ? "Airtime purchases are currently unavailable."
                            : "Data purchases are currently unavailable."}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {m.card.service === "transfer"
                          ? "Send money"
                          : m.card.service === "airtime"
                            ? "Buy airtime"
                            : "Buy data"}
                      </p>
                      <p className="mt-1 break-all text-2xl font-extrabold tabular-nums text-foreground">
                        {naira(m.card.amount)}
                      </p>
                      <dl className="mt-4 space-y-2 text-sm">
                        <Row
                          k={m.card.service === "transfer" ? "Account number" : "Phone number"}
                          v={m.card.account}
                        />
                        <Row
                          k={m.card.service === "transfer" ? "Bank" : "Network"}
                          v={m.card.bank}
                        />
                        {m.card.narration && <Row k="For" v={m.card.narration} />}
                      </dl>
                      {m.card.status === "pending" ? (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button variant="plain" size="none"
                            onClick={() =>
                              patch(m.id, (x) => ({
                                ...x,
                                card: { ...(x.card as ApprovalCard), status: "cancelled" },
                              }))
                            }
                            className="min-h-11 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-accent"
                          >
                            Cancel
                          </Button>
                          <Button variant="plain" size="none"
                            type="button"
                            disabled
                            className="min-h-11 cursor-not-allowed rounded-xl bg-muted py-2.5 text-sm font-bold text-muted-foreground"
                          >
                            Unavailable
                          </Button>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm font-medium text-foreground">
                          {m.card.status === "approved"
                            ? "Status unavailable · check your account before retrying"
                            : "Cancelled"}
                        </p>
                      )}
                    </div>
                  )}
                  {m.card?.kind === "receipt" && (
                    <div className="rounded-[28px] bg-card p-5 text-card-foreground">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <CircleHelp className="h-4 w-4 text-muted-foreground" /> Transaction status
                      </div>
                      <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-foreground">
                        We couldn’t verify this transaction. Check your account before retrying.
                      </p>
                    </div>
                  )}
                  <p className={`text-[10px] text-muted-foreground ${m.role === "user" ? "text-right" : ""}`}>{new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
            {typing && (
              <div role="status" aria-label="Nella is replying" className="flex items-center gap-2">
                <NellaMascot small className="h-7 w-7" />
                <div className="glass flex gap-1 rounded-full px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full bg-primary-glow"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            {!typing && chatChoices.length > 0 && (
              chatChoices.length > 4 ? (
                <div className="glass ml-9 flex max-w-xs flex-col overflow-hidden rounded-2xl" role="listbox" aria-label="Choose an option">
                  <p className="border-b border-border/60 px-4 py-2 text-xs font-medium text-muted-foreground">Tap to choose</p>
                  <div className="max-h-72 overflow-y-auto">
                    {chatChoices.map(choice => (
                      <button key={choice} type="button" role="option" aria-selected="false" className="flex min-h-11 w-full items-center justify-between gap-2 border-b border-border/40 px-4 py-2.5 text-left text-sm last:border-b-0 hover:bg-accent/50 active:bg-accent" onClick={() => send(choice)}>
                        <span className="min-w-0 flex-1">{choice}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pl-9" aria-label="Chat replies">{chatChoices.map(choice => <Button key={choice} variant="outline" className="min-h-11 max-w-full whitespace-normal" onClick={() => send(choice)}>{choice}</Button>)}</div>
              )
            )}
            <div ref={endRef} />
          </div>
        )}
      </main>

      {newMessages && <Button variant="secondary" className="mx-auto my-2 h-11 shrink-0" onClick={() => { followsBottom.current = true; setNewMessages(false); endRef.current?.scrollIntoView({ block: "end" }); }}><ArrowDown />New messages</Button>}
      <NellaServices panel={panel} onChange={setPanel} onBack={panelBack} depth={panelDepth} user={user} previews={previews} onReuse={(draft: PaymentDraft) => { changePanel(null); if (reply.busy.current) return; const turn = startPayment(draft.service, "", user.name, draft); setPayment(turn.state); setChatChoices(turn.choices ?? []); if (turn.preview) keepPreview(turn.preview); nellaSays([{ text: turn.text }]); }} />
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          send(text);
        }}
        className="mx-auto w-full max-w-2xl shrink-0 border-t border-border bg-card px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5"
      >
        {pendingPhoto && (
          <div className="glass mb-2 flex items-center gap-3 rounded-2xl border border-border p-3">
            <img
              src={pendingPhoto.url}
              alt="Selected photo"
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Review this photo</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Review your photo before attaching it.
              </p>
            </div>
            <Button variant="plain" size="none"
              type="button"
              onClick={() => {
                clearPhoto();
                setCameraOpen(true);
              }}
              className="min-h-11 rounded-lg px-2 py-2 text-xs font-semibold hover:bg-accent"
            >
              Retake
            </Button>
            <Button variant="plain" size="none"
              type="button"
              onClick={clearPhoto}
              aria-label="Remove photo"
              className="min-h-11 min-w-11 rounded-full p-2 text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button variant="plain" size="none"
              type="button"
              onClick={sendPhoto}
              disabled={typing}
              className="min-h-11 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-40"
            >
              Attach
            </Button>
          </div>
        )}
        {voiceMode === "recording" && (
          <div className="glass mb-2 flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" /> Recording ·{" "}
              {recordingSeconds}s
            </p>
            <Button variant="plain" size="none"
              type="button"
              onClick={stopVoiceRecording}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              Stop & review
            </Button>
          </div>
        )}
        {voiceMode === "review" && (
          <div className="glass mb-2 space-y-2 rounded-2xl border border-border p-3">
            <p className="text-sm font-semibold">Review voice note · {voiceDuration}s</p>
            <audio
              controls
              src={voiceUrl}
              className="w-full"
              aria-label="Review voice note before sending"
            />
            <div className="flex justify-end gap-2">
              <Button variant="plain" size="none"
                type="button"
                onClick={discardVoiceRecording}
                className="rounded-xl border border-border px-3 py-2 text-sm font-semibold"
              >
                Discard
              </Button>
              <Button variant="plain" size="none"
                type="button"
                onClick={() => {
                  discardVoiceRecording();
                  void startVoiceRecording();
                }}
                className="rounded-xl border border-border px-3 py-2 text-sm font-semibold"
              >
                Record again
              </Button>
              <Button variant="plain" size="none"
                type="button"
                onClick={sendVoice}
                disabled={typing}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40"
              >
                Send voice note
              </Button>
            </div>
          </div>
        )}
        {notice && (
          <p
            role="status"
            className="mb-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            {notice}
          </p>
        )}
        {cameraOpen && (
          <NellaCamera
            onCapture={(file, url) => acceptPhoto(file, url)}
            onClose={() => setCameraOpen(false)}
            onFallback={() => {
              setCameraOpen(false);
              cameraInputRef.current?.click();
            }}
          />
        )}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={selectPhoto}
          className="hidden"
          aria-label="Take a bill photo"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={selectPhoto}
          className="hidden"
          aria-label="Choose a bill photo"
        />
        <div className="glass relative flex items-end gap-0.5 rounded-3xl border border-border p-1.5 sm:gap-1 sm:p-2">
          {photoMenu && (
            <div
              role="group"
              aria-label="Add a payment photo"
              className="glass absolute bottom-[calc(100%+0.5rem)] left-1 z-10 w-52 rounded-2xl border border-border p-2 shadow-glow"
              id="photo-options"
            >
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Add a photo</p>
              <Button variant="plain" size="none" type="button" className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left text-sm font-medium hover:bg-accent" onClick={() => { setPhotoMenu(false); setPanel("services"); }}><Wallet className="h-4 w-4" />Money services</Button>
              <Button variant="plain" size="none"
                type="button"
                onClick={() => {
                  setPhotoMenu(false);
                  setCameraOpen(true);
                }}
                className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left text-sm font-medium hover:bg-accent"
              >
                <Camera className="h-4 w-4" /> Take a photo
              </Button>
              <Button variant="plain" size="none"
                type="button"
                onClick={() => {
                  setPhotoMenu(false);
                  galleryInputRef.current?.click();
                }}
                className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left text-sm font-medium hover:bg-accent"
              >
                <ImagePlus className="h-4 w-4" /> Choose from photos
              </Button>
            </div>
          )}
          <Button variant="plain" size="none"
            type="button"
            onClick={() => setPhotoMenu((open) => !open)}
            aria-label="Add attachment"
            aria-expanded={photoMenu}
            aria-controls="photo-options"
            title="Add attachment"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-accent"
          >
            <Plus className="h-5 w-5" />
          </Button>
          <textarea
            ref={inputRef}
            disabled={voiceMode === "recording"}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
            }}
            onKeyDown={(e) => {
              if (shouldSendOnEnter({ key: e.key, shiftKey: e.shiftKey, isComposing: e.nativeEvent.isComposing }, window.matchMedia("(pointer: coarse)").matches)) {
                e.preventDefault();
                send(text);
              }
            }}
            placeholder="Message Nella…"
            aria-label="Message Nella"
            className="max-h-32 min-w-0 flex-1 resize-none rounded-lg bg-transparent px-1 py-2 text-base text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {text.trim() ? (
            <Button variant="plain" size="none"
              type="submit"
              disabled={typing}
              aria-label="Send message"
              className="shadow-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="plain" size="none"
              type="button"
              onClick={() =>
                voiceMode === "recording" ? stopVoiceRecording() : void startVoiceRecording()
              }
              aria-label={
                voiceMode === "recording" ? "Stop voice recording" : "Record a voice note"
              }
              title="Record a voice note"
              disabled={voiceMode === "review"}
              className={`shadow-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${
                voiceMode === "recording"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="min-w-0 break-all text-right font-semibold text-foreground">{v}</dd>
    </div>
  );
}

function QuickActionTile({
  action,
  onClick,
  disabled = false,
}: {
  action: QuickAction;
  onClick: () => void;
  disabled?: boolean;
}) {
  const Icon = action.icon;

  return (
    <Button variant="plain" size="none"
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-20 w-full items-center justify-start gap-3 whitespace-normal rounded-xl border border-border bg-card px-3 py-3 text-left text-foreground hover:border-primary/40 hover:bg-accent disabled:opacity-50"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-glow">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 text-sm font-semibold">{action.label}</span>
    </Button>
  );
}

function ProfileAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button variant="plain" size="none"
      onClick={onClick}
      className="flex min-h-11 w-full items-center justify-start gap-3 rounded-lg px-2 py-2 text-left text-sm text-foreground hover:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" /> {label}
    </Button>
  );
}
