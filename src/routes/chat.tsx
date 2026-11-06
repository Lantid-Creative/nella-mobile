import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeftRight,
  ArrowUp,
  ArrowDown,
  Bell,
  Sun,
  Moon,
  Smartphone,
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
import { dayLabel, filterChoices, greeting, groupInfo, haptic, paymentSteps } from "@/lib/chat-ux";
import { MessageGestures, quoteText, toggleReaction } from "@/components/message-gestures";
import { NellaCamera } from "@/components/nella-camera";
import { VoiceNoteControl } from "@/components/voice-note-control";
import { useVoiceNote } from "@/hooks/use-voice-note";
import { draftFromPreview } from "@/lib/preview-workspace";
import { PaymentApproval } from "@/components/payment-approval";
import { NellaServices, PaymentPreviewCard } from "@/components/nella-services";
import { panelForMessage, paymentPreview, type AppPanel, type ReceiptPreview } from "@/lib/app-provisions";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePendingReply, isNearConversationBottom, shouldSendOnEnter } from "@/hooks/use-chat-behavior";
import { useServiceNavigation } from "@/hooks/use-service-navigation";
import { useChatViewport } from "@/hooks/use-chat-viewport";
import { STORAGE_NOTICE } from "@/lib/demo-storage";
import { answerPayment, startPayment, paymentService, type PaymentConversation } from "@/lib/chat-payments";
import { SERVICE_LABELS, type PaymentDraft } from "@/lib/app-provisions";
import nellaLogo from "@/assets/nella-nav-logo.png.asset.json";
import nellaLogoDark from "@/assets/nella-footer-logo.png.asset.json";
import { useTheme, type ThemeChoice } from "@/lib/theme";

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
  const [replyingTo, setReplyingTo] = useState<ChatMsg | null>(null);
  const [choiceQuery, setChoiceQuery] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [offline, setOffline] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [swipeTip, setSwipeTip] = useState(false);
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
  const voice = useVoiceNote(setNotice);
  const voiceMode = voice.mode;
  const voiceUrl = voice.url;
  const voiceDuration = voice.seconds;
  const recordingSeconds = voice.seconds;
  const startVoiceRecording = voice.start;
  const stopVoiceRecording = voice.stop;
  const discardVoiceRecording = voice.discard;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const msgsRef = useRef<ChatMsg[]>([]);
  const objectUrlsRef = useRef<string[]>([]);
  useChatViewport(scrollRef, followsBottom);
  const scrollToLatest = (behavior: ScrollBehavior = "auto") => {
    const conversation = scrollRef.current;
    conversation?.scrollTo({ top: conversation.scrollHeight, behavior });
  };

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
    const connection = () => setOffline(!navigator.onLine);
    connection();
    window.addEventListener("offline", connection);
    window.addEventListener("online", connection);
    try { setSwipeTip(!localStorage.getItem("nella.tip.swipe")); } catch { /* storage unavailable */ }
    return () => { window.removeEventListener("nella-storage-warning", warning); window.removeEventListener("offline", connection); window.removeEventListener("online", connection); };
  }, []);

  useEffect(() => {
    const scrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    if (followsBottom.current) {
      const conversation = scrollRef.current;
      conversation?.scrollTo({ top: conversation.scrollHeight, behavior: scrollBehavior });
      setNewMessages(false);
    } else setNewMessages(true);
  }, [msgs, typing]);

  useEffect(
    () => () => {

      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  useEffect(() => {
    const hidden = () => { if (document.hidden) { setApproval(null); setPhotoMenu(false); inputRef.current?.blur(); } };
    const back = () => { setApproval(null); setPendingPhoto(null); setPhotoCaption(""); };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("popstate", back);
    return () => { document.removeEventListener("visibilitychange", hidden); window.removeEventListener("popstate", back); };
  }, []);

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
      if (offline) { setNotice("You’re offline. Reconnect before approval. Nothing has been submitted."); return; }
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
      { id: uid(), role: "user", text: t, ...(media ? { media } : {}), ...(replyingTo ? { replyTo: { id: replyingTo.id, role: replyingTo.role, text: quoteText(replyingTo.text ?? replyingTo.media?.label) } } : {}), at: Date.now() },
    ]);
    setReplyingTo(null);
    setChoiceQuery("");
    haptic();
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
      cameraInputRef.current?.click();
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

  const sendPhoto = () => {
    if (!pendingPhoto || reply.busy.current) return;
    const media: ChatMedia = {
      kind: "image",
      label: pendingPhoto.file.name,
      previewUrl: pendingPhoto.url,
    };
    send(photoCaption.trim() || "Payment photo", media);
    setPhotoCaption("");
    setPendingPhoto(null);
  };

  const sendVoice = () => {
    if (!voiceUrl || reply.busy.current) return;
    const media: ChatMedia = {
      kind: "audio",
      label: "Voice note",
      previewUrl: voiceUrl,
      durationSeconds: voiceDuration,
    };
    send("Voice note", media);
    const sent = voice.take();
    objectUrlsRef.current.push(sent.url);
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
  const reuse = (draft: PaymentDraft) => {
    if (reply.busy.current) return;
    setApproval(null); changePanel(null); followsBottom.current = true;
    const turn = startPayment(draft.service, "", user.name, draft);
    setPayment(turn.state); setChatChoices(turn.choices ?? []);
    nellaSays([{ text: turn.text, ...(turn.preview ? { card: { kind: "preview" as const, preview: turn.preview } } : {}) }]);
  };
  const latestPreviewId = [...msgs].reverse().find(message => message.card?.kind === "preview")?.id;
  const lastPrepared = [...previews].reverse().map(draftFromPreview).find(draft => draft !== null);
  const first = user.name.split(" ")[0] || "there";
  const empty = msgs.length === 0;

  return (
    <div className="chat-surface mx-auto flex h-[var(--app-height,100dvh)] min-h-0 w-full max-w-3xl flex-col overflow-hidden">
      {approval && approval === payment && <PaymentApproval receipt={paymentPreview(approval.draft, user.name)} user={user} onClose={() => setApproval(null)} onComplete={() => {
        setApproval(null);
        setPayment(null);
        setChatChoices([]);
        nellaSays([{ text: "Demo PIN checked. No payment was submitted and no money moved. Live payment approval is not connected yet." }], 300);
      }} />}
      <header className="relative z-10 grid shrink-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 bg-background px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <img src={(theme.dark ? nellaLogoDark : nellaLogo).url} alt="Nella" width={697} height={178} className="h-7 w-auto shrink-0" />
        <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground" aria-label="Notifications" title="Notifications" onClick={() => setPanel("notifications")}><Bell /></Button>
        <Button variant="plain" size="none"
          onClick={() => {
            setMenu((m) => !m);
            setConfirmClear(false);
            setConfirmLogout(false);
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
            <div className="mb-2">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Appearance</p>
              <div role="radiogroup" aria-label="Appearance" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
                {([["light", "Light", Sun], ["dark", "Dark", Moon], ["system", "Phone", Smartphone]] as [ThemeChoice, string, typeof Sun][]).map(([value, label, Icon]) => (
                  <Button key={value} type="button" role="radio" aria-checked={theme.choice === value} variant={theme.choice === value ? "secondary" : "ghost"} className={`h-11 gap-1.5 text-xs ${theme.choice === value ? "bg-card shadow-sm" : ""}`} onClick={() => theme.setChoice(value)}><Icon className="h-4 w-4" />{label}</Button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">Phone follows your phone's light or dark setting.</p>
            </div>
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
                      setReplyingTo(null);
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
            {!confirmLogout ? <ProfileAction icon={LogOut} label="Log out" onClick={() => setConfirmLogout(true)} /> : <div className="mt-2 rounded-xl bg-muted p-3"><p className="text-sm font-semibold">Log out of Nella?</p><p className="mt-1 text-xs text-muted-foreground">You can log back in with your PIN or biometrics.</p><div className="mt-2 flex gap-2"><Button variant="outline" className="h-11 flex-1" onClick={() => setConfirmLogout(false)}>Stay</Button>
            <Button variant="destructive" className="h-11 flex-1"
              onClick={() => {
                reply.cancel();
                if (!signOut()) { setNotice(STORAGE_NOTICE); return; }
                navigate({ to: "/auth", replace: true });
              }}
            >
              Log out
            </Button></div></div>}
          </DialogContent>
        </Dialog>
      </header>

      <main
        ref={scrollRef}
        onScroll={event => { followsBottom.current = isNearConversationBottom(event.currentTarget); if (followsBottom.current) setNewMessages(false); }}
        className="chat-doodles mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5"
        onClick={() => setMenu(false)}
      >
        {empty ? (
          <div className="flex min-h-full flex-col items-center justify-center pb-4 pt-5 text-center">
            <NellaMascot className="chat-welcome-mascot mb-3 h-36 w-36 shrink-0" />
            <span className="mb-3 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-primary">YOUR MONEY, IN A CHAT</span>
            <h1 className="text-2xl font-extrabold">{greeting()}, {first} <span aria-hidden="true">👋</span></h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">I'm Nella. What can I help you with today?</p>
            <section aria-label="Payment actions" className="mt-6 w-full max-w-sm">
              <div className="grid grid-cols-2 gap-2.5">
                {QUICK_ACTIONS.map((action) => <QuickActionTile key={action.label} action={action} onClick={() => runQuickAction(action)} disabled={typing} />)}
              </div>
            </section>
            <Button variant="ghost" className="mt-2 h-11" onClick={() => void startVoiceRecording()}><Mic />Voice note</Button>
            <Button variant="link" className="mt-2 h-11" onClick={() => setPanel("services")}>All money services<ArrowUp className="rotate-45" /></Button>
            {user && !canEnterChat(user) && <Button variant="ghost" className="h-11 text-xs text-muted-foreground" onClick={() => setPanel("onboarding")}><Shield />Complete your account setup</Button>}
            <p className="mt-3 text-[11px] text-muted-foreground">Preview only · Banking services aren't connected</p>
          </div>
        ) : (
          <div role="log" aria-label="Conversation with Nella" aria-live="polite" className="space-y-5 py-5">
            {swipeTip && <div className="flex items-center justify-between gap-2 rounded-2xl bg-secondary px-4 py-2 text-xs text-secondary-foreground"><span>Tip: swipe a message right to reply, or press and hold to react.</span><Button variant="ghost" size="none" className="h-11 px-3 text-xs font-semibold" onClick={() => { setSwipeTip(false); try { localStorage.setItem("nella.tip.swipe", "1"); } catch { /* ignore */ } }}>Got it</Button></div>}
            {msgs.length > visibleCount && <Button variant="outline" className="h-11 w-full" onClick={() => { const element = scrollRef.current; const height = element?.scrollHeight ?? 0; const top = element?.scrollTop ?? 0; followsBottom.current = false; setVisibleCount(count => count + 40); requestAnimationFrame(() => { if (element) element.scrollTop = top + element.scrollHeight - height; }); }}>Earlier messages</Button>}
            {msgs.slice(-visibleCount).map((m, index, shown) => { const g = groupInfo(shown, index); return (
              <div key={m.id} className={g.firstInGroup ? "" : "-mt-4"}>
              {g.newDay && <p className="mb-4 text-center"><span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">{dayLabel(m.at)}</span></p>}
              <div
                id={`msg-${m.id}`}
                className={`message-enter flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "nella" && (g.lastInGroup ? <NellaMascot small className="mr-2 h-7 w-7 self-end" /> : <span className="mr-2 w-7 shrink-0" aria-hidden />)}
                <div className="min-w-0 max-w-[85%]">
                <MessageGestures copyText={m.text} mine={m.role === "user"} reactions={m.reactions} onReply={() => { setReplyingTo(m); inputRef.current?.focus(); }} onReact={(emoji) => patch(m.id, (x) => ({ ...x, reactions: toggleReaction(x.reactions, emoji) }))}>
                <div className="space-y-2">
                  {m.replyTo && (
                    <Button variant="plain" size="none" onClick={() => document.getElementById(`msg-${m.replyTo?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} className={`block h-auto w-full whitespace-normal rounded-xl border-l-4 border-primary bg-muted px-3 py-2 text-left text-xs text-muted-foreground`}>
                      <span className="block font-semibold text-foreground">{m.replyTo.role === "user" ? "You" : "Nella"}</span>
                      <span className="line-clamp-2 break-words">{m.replyTo.text}</span>
                    </Button>
                  )}
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
                  {m.card?.kind === "preview" && <PaymentPreviewCard receipt={m.card.preview} onEdit={payment?.field === "review" && m.id === latestPreviewId && !typing ? field => { setApproval(null); send(`Change ${field === "destination" ? "number" : field}`); } : undefined} />}
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
                </div>
                </MessageGestures>
                  {g.lastInGroup && <p className={`text-[10px] text-muted-foreground ${m.role === "user" ? "text-right" : ""}`}>{new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>}
                </div>
              </div>
              </div>
            ); })}
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
                  {chatChoices.length > 8 && <input value={choiceQuery} onChange={(e) => setChoiceQuery(e.target.value)} placeholder="Search" aria-label="Search options" className="h-11 border-b border-border/60 bg-transparent px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring" />}
                  <div className="max-h-72 overflow-y-auto">
                    {filterChoices(chatChoices, choiceQuery).length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">No match. Type it in the chat instead.</p>}
                    {filterChoices(chatChoices, choiceQuery).map(choice => (
                      <Button variant="plain" size="none" key={choice} type="button" role="option" aria-selected="false" className="flex min-h-11 w-full items-center justify-between gap-2 whitespace-normal border-b border-border/40 px-4 py-2.5 text-left text-sm last:border-b-0 hover:bg-accent/50 active:bg-accent" onClick={() => send(choice)}>
                        <span className="min-w-0 flex-1">{choice}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pl-9" aria-label="Chat replies">{chatChoices.map(choice => <Button key={choice} variant="outline" className="min-h-11 max-w-full whitespace-normal" onClick={() => send(choice)}>{choice}</Button>)}</div>
              )
            )}
          </div>
        )}
      </main>

      {!payment && !typing && lastPrepared && <Button variant="ghost" className="mx-3 my-1 h-auto min-h-11 shrink-0 whitespace-normal text-xs" onClick={() => reuse(lastPrepared)}><RotateCcw className="shrink-0" />Prepare again · {SERVICE_LABELS[lastPrepared.service]} · {naira(Number(lastPrepared.amount))}</Button>}
      {newMessages && <Button variant="secondary" className="mx-auto my-2 h-11 shrink-0" onClick={() => { followsBottom.current = true; setNewMessages(false); scrollToLatest(); }}><ArrowDown />New messages</Button>}
      <NellaServices panel={panel} onChange={setPanel} onBack={panelBack} depth={panelDepth} user={user} previews={previews} onReuse={reuse} />
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          send(text);
        }}
        className="chat-composer mx-auto w-full max-w-2xl shrink-0 border-t border-border bg-card px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5"
      >
        {pendingPhoto && (
          <div role="dialog" aria-modal="true" aria-label="Send photo" className="photo-review fixed left-0 right-0 z-50 flex flex-col bg-foreground text-background">
            <div className="flex items-center justify-between px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
              <Button variant="plain" size="none" type="button" onClick={() => { clearPhoto(); setPhotoCaption(""); }} aria-label="Discard photo" className="h-11 w-11 rounded-full hover:bg-background/10"><X className="h-6 w-6" /></Button>
              <Button variant="plain" size="none" type="button" onClick={() => { clearPhoto(); cameraInputRef.current?.click(); }} className="h-11 rounded-full px-4 text-sm font-semibold hover:bg-background/10"><Camera className="h-5 w-5" />Retake</Button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center p-2">
              <img src={pendingPhoto.url} alt="Photo to send" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex items-end gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
              <input value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value.slice(0, 200))} onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); sendPhoto(); } }} placeholder="Add a caption…" aria-label="Add a caption" className="h-12 min-w-0 flex-1 rounded-full bg-background/15 px-4 text-base text-background placeholder:text-background/60 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <Button type="button" size="none" onClick={sendPhoto} disabled={typing} aria-label="Send photo" className="h-12 w-12 shrink-0 rounded-full"><ArrowUp className="h-5 w-5" /></Button>
            </div>
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
              className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              Stop & review
            </Button>
            <Button variant="ghost" size="icon" type="button" aria-label="Cancel recording" title="Cancel recording" onClick={discardVoiceRecording} className="h-11 w-11 shrink-0"><X /></Button>
          </div>
        )}
        {voiceMode === "starting" && <p role="status" className="mb-2 text-sm text-muted-foreground">Waiting for microphone permission…</p>}
        {voiceMode === "recording" && <p className="mb-2 text-xs text-muted-foreground">Slide left to cancel</p>}
        {voiceMode === "review" && (
          <div className="glass mb-2 space-y-2 rounded-2xl border border-border p-3">
            <p className="text-sm font-semibold">Review voice note · {voiceDuration}s</p>
            <audio
              controls
              src={voiceUrl}
              className="w-full"
              aria-label="Review voice note before sending"
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="plain" size="none"
                type="button"
                onClick={discardVoiceRecording}
                className="min-h-11 rounded-xl border border-border px-3 py-2 text-sm font-semibold"
              >
                Discard
              </Button>
              <Button variant="plain" size="none"
                type="button"
                onClick={() => {
                  discardVoiceRecording();
                  void startVoiceRecording();
                }}
                className="min-h-11 rounded-xl border border-border px-3 py-2 text-sm font-semibold"
              >
                Record again
              </Button>
              <Button variant="plain" size="none"
                type="button"
                onClick={sendVoice}
                disabled={typing}
                className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40"
              >
                Send voice note
              </Button>
            </div>
          </div>
        )}
        {offline && <p role="status" className="mb-2 rounded-xl bg-muted px-3 py-2 text-sm font-medium text-foreground">You’re offline. This demo can prepare details locally, but messages and payments are not queued or sent to Nella.</p>}
        {payment && (
          <div className="mb-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
            <ol aria-label="Payment progress" className="flex min-w-0 flex-1 gap-1 overflow-x-auto text-[11px]">
              {paymentSteps(payment).map((step) => <li key={step.key} aria-current={step.current ? "step" : undefined} className={`shrink-0 rounded-full px-2 py-1 font-semibold ${step.current ? "bg-primary text-primary-foreground" : step.done ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"}`}>{step.done ? "✓ " : ""}{step.label}</li>)}
            </ol>
            <Button variant="ghost" size="none" type="button" className="h-11 shrink-0 px-3 text-xs font-semibold text-destructive" onClick={() => { reply.cancel(); setPayment(null); setChatChoices([]); commit([...msgsRef.current, { id: uid(), role: "nella", text: "Payment cancelled. Nothing was sent.", at: Date.now() }]); }}>Cancel</Button>
          </div>
        )}
        {replyingTo && (
          <div className="mb-2 flex items-center gap-2 rounded-2xl border-l-4 border-primary bg-muted px-3 py-2">
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-semibold text-foreground">Replying to {replyingTo.role === "user" ? "yourself" : "Nella"}</p>
              <p className="truncate text-muted-foreground">{quoteText(replyingTo.text ?? replyingTo.media?.label)}</p>
            </div>
            <Button variant="ghost" size="none" type="button" aria-label="Cancel reply" onClick={() => setReplyingTo(null)} className="h-11 w-11 rounded-full"><X className="h-4 w-4" /></Button>
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
                  cameraInputRef.current?.click();
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
            onFocus={() => { setPhotoMenu(false); if (followsBottom.current) requestAnimationFrame(() => scrollToLatest()); }}
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
            <VoiceNoteControl mode={voiceMode} disabled={typing} start={() => void startVoiceRecording()} stop={stopVoiceRecording} discard={discardVoiceRecording} />
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
