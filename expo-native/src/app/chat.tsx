import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Dimensions, KeyboardAvoidingView, Image } from 'react-native';
import { useNellaTheme } from '@/lib/theme-context';
import {
  currentUser,
  canEnterChat,
  demoReply,
  loadChat,
  naira,
  saveChat,
  signOut,
  type ChatMsg,
  type ChatMedia,
} from '@/lib/demo-store';
import { dayLabel, groupInfo, greeting, paymentSteps } from '@/lib/chat-ux';
import { Button } from '@/components/ui/button';
import { NellaMascot } from '@/components/nella-mascot';
import { ArrowDown, ArrowLeftRight, ArrowUp, Bell, Camera, ChevronRight, ImagePlus, LogOut, Mic, Plus, ReceiptText, RotateCcw, Shield, Smartphone, UsersRound, Wallet, X } from 'lucide-react-native';
import { startPayment, answerPayment, paymentService, type PaymentConversation, type PaymentDraft } from '@/lib/chat-payments';
import { SERVICE_LABELS, type AppPanel, type ReceiptPreview } from '@/lib/app-provisions';
import { paymentPreview } from '@/lib/app-provisions';
import { draftFromPreview } from '@/lib/preview-workspace';
import { PaymentPreviewCard } from '@/components/payment-preview-card';
import { PaymentApproval } from '@/components/payment-approval';
import { NellaServices } from '@/components/nella-services';
import { VoiceNoteControl } from '@/components/voice-note-control';
import * as ImagePicker from 'expo-image-picker';
import * as CameraExpo from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { login, isDemoMode } from '@/lib/api-auth';
import { post, get } from '@/lib/api-client';
import { fetchBalance } from '@/lib/api-balance';

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const NARRATIONS = ["Rent", "Food", "Family", "Business"];

const QUICK_ACTIONS: { label: string; prompt: string; icon: any; attachment?: boolean }[] = [
  { label: "Snap to pay", prompt: "", icon: Camera, attachment: true },
  { label: "Balance", prompt: "Check my balance", icon: Wallet },
  { label: "Send money", prompt: "Send money", icon: ArrowLeftRight },
  { label: "Buy airtime", prompt: "Buy airtime", icon: Smartphone },
  { label: "Pay a bill", prompt: "Pay a bill", icon: ReceiptText },
];

export default function ChatPage() {
  const { theme } = useNellaTheme();
  const s = createStyles(theme);

  const [user, setUser] = useState<any | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMsg | null>(null);
  const [choiceQuery, setChoiceQuery] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [offline, setOffline] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [swipeTip, setSwipeTip] = useState(false);
  const [balance, setBalance] = useState<{ available: number; accountNo: string | null } | null>(null);
  const [payment, setPayment] = useState<PaymentConversation | null>(null);
  const [approval, setApproval] = useState<PaymentConversation | null>(null);
  const [chatChoices, setChatChoices] = useState<string[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [panel, setPanel] = useState<AppPanel | null>(null);
  const [newMessages, setNewMessages] = useState(false);
  const [visibleCount, setVisibleCount] = useState(40);
  const [pendingPhoto, setPendingPhoto] = useState<{ uri: string; name: string } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState<"idle" | "recording" | "review">("idle");
  const [voiceUrl, setVoiceUrl] = useState("");
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [notice, setNotice] = useState("");

  const scrollRef = useRef<ScrollView>(null);
  const followsBottom = useRef(true);
  const msgsRef = useRef<ChatMsg[]>([]);
  const cameraRef = useRef<CameraExpo.CameraView>(null);
  const [cameraType, setCameraType] = useState("back");
  const [zoom, setZoom] = useState(1);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const u = await currentUser();
      if (!mounted || !u || !(await canEnterChat(u))) {
        if (mounted) router.replace("/auth");
        return;
      }
      setUser(u);
      const m = await loadChat(u.phone);
      msgsRef.current = m;
      setMsgs(m);
      // Fetch wallet balance from live API
      try {
        const bal = await fetchBalance();
        setBalance({ available: bal.available, accountNo: bal.accountNo });
      } catch {
        // Balance unavailable — show demo message
      }
    };
    void init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (followsBottom.current && scrollRef.current) {
      void scrollRef.current.scrollToEnd?.({ animated: true });
      setNewMessages(false);
    } else {
      setNewMessages(true);
    }
  }, [msgs, followsBottom]);

  useEffect(() => {
    return () => {
      if (audioRecording.current) {
        void audioRecording.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const audioRecording = useRef<any>(null);
  const voiceInterval = useRef<any>(null);

  const commit = async (next: ChatMsg[]) => {
    msgsRef.current = next;
    setMsgs(next);
    if (user) {
      await saveChat(user.phone, next);
    }
  };

  const nellaSays = (parts: Omit<ChatMsg, "id" | "at" | "role">[], delay = 800) => {
    setTimeout(() => {
      const now = Date.now();
      const newParts = parts.map((p) => ({ ...p, id: uid(), role: "nella" as const, at: now }));
      commit([...msgsRef.current, ...newParts]);
    }, delay);
  };

  const patch = (id: string, fn: (m: ChatMsg) => ChatMsg) => {
    commit(msgsRef.current.map((m) => (m.id === id ? fn(m) : m)));
  };

  const send = async (raw: string, media?: ChatMedia) => {
    const t = raw.trim();
    if (!t || !user) return;

    followsBottom.current = true;

    const userMsg: ChatMsg = { id: uid(), role: "user", text: t, at: Date.now() };
    if (media) userMsg.media = media;
    if (replyingTo) userMsg.replyTo = { id: replyingTo.id, role: replyingTo.role, text: replyingTo.text ?? replyingTo.media?.label ?? "" };

    commit([...msgsRef.current, userMsg]);
    setReplyingTo(null);
    setChoiceQuery("");
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText("");
    if (inputRef.current) inputRef.current.blur();

    if (media) {
      nellaSays([
        { text: `I can’t read payment details from ${media.kind === "image" ? "photos" : "voice"} yet. No payment has been made. ${payment ? "Please reply to my last question here in chat." : "What would you like to do?"}` },
      ]);
      if (!payment) setChatChoices(Object.values(SERVICE_LABELS));
      setPendingPhoto(null);
      return;
    }

    const service = payment && /^\d{10}$/.test(t) ? null : paymentService(t);
    if (service === "services") {
      setPayment(null);
      setChatChoices(Object.values(SERVICE_LABELS));
      nellaSays([{ text: "What would you like to do?" }]);
      return;
    }

    const requested = panelForMessage(t);
    if (service || (payment && !requested)) {
      const turn = service && (!payment || service !== payment.draft.service || /^(?:please\s+)?(?:send|transfer|buy|recharge)\b|^(electricity|cable tv)$/i.test(t))
        ? startPayment(service, t, user.name, undefined, user.phone)
        : payment
          ? answerPayment(payment, t, user.name, user.phone)
          : null;
      if (turn) {
        setPayment(turn.state);
        setChatChoices(turn.choices ?? []);
        
        // Call live API for quote when payment reaches review state
        if (turn.preview && turn.state.field === "review") {
          try {
            const amountMinor = Number(turn.state.draft.amount) * 100;
            const quote = await quoteTransfer({
              service: 'transfer',
              amount: turn.state.draft.amount,
              destination: turn.state.draft.destination,
              provider: turn.state.draft.provider,
              narration: turn.state.draft.narration,
              plan: turn.state.draft.plan,
            });
            if (quote.ok) {
              // Store the reference and amount in the draft for approval
              setPayment(prev => prev && {
                ...prev,
                draft: {
                  ...prev.draft,
                  reference: quote.reference,
                  amountMinor: quote.amountMinor || amountMinor,
                },
              });
            }
          } catch {
            // API failed, continue with local draft
          }
          
          nellaSays([{ text: turn.text, card: { kind: "preview", preview: turn.preview } as any }]);
        } else {
          nellaSays([{ text: turn.text }]);
        }
        return;
      }
    }

    setChatChoices([]);
    const requestedPanel = panelForMessage(t);
    if (requestedPanel) {
      setPanel(requestedPanel);
      setProfileOpen(true);
      return;
    }
    // Handle balance inquiries via live API
    if (/balance|how much.*(have|left)|wallet/.test(t)) {
      try {
        const bal = await fetchBalance();
        setBalance({ available: bal.available, accountNo: bal.accountNo });
        nellaSays([{ text: `Your Nella wallet balance is ${naira(bal.available)}.` }]);
      } catch {
        nellaSays([{ text: 'Your wallet balance is currently unavailable.' }]);
      }
      return;
    }
    nellaSays(demoReply(t));
  };

  const panelForMessage = (raw: string): AppPanel | null => {
    const text = raw.trim().toLowerCase();
    if (/\b(refund|dispute|complaint)\b/.test(text)) return "support";
    if (/\b(forgot|reset|change)\s+(?:my\s+|payment\s+)?pin\b|\b(recover|freeze|unblock)\s+(?:my\s+)?account\b/.test(text)) return "security";
    if (/^(send money|transfer money)$/.test(text)) return "transfer";
    if (/^(buy airtime|recharge)$/.test(text)) return "airtime";
    if (/^(buy data|data plans)$/.test(text)) return "data";
    if (/^(pay a bill|pay bills|electricity)$/.test(text)) return "services";
    if (/^(cable|cable tv)$/.test(text)) return "cable";
    if (/\b(fund|funding)\b|\baccount details\b|\bmy account\b/.test(text)) return "account";
    if (/onboard|verify.*identity|verification|complete.*setup/.test(text)) return "onboarding";
    if (/notification|alerts/.test(text)) return "notifications";
    if (/recent activity|transaction history|receipts/.test(text)) return "activity";
    if (/beneficiar/.test(text)) return "beneficiaries";
    if (/scheduled|reminder/.test(text)) return "scheduled";
    if (/security|change pin|freeze|unblock/.test(text)) return "security";
    if (/support|help|agent/.test(text)) return "support";
    if (/spending|insights|statement/.test(text)) return "insights";
    if (/invoice|payroll|business|payment request|bulk/.test(text)) return "business";
    if (/\b(refer|referral|referrals|ambassador|ambassadors)\b/.test(text)) return "referrals";
    return null;
  };

  const runQuickAction = (action: typeof QUICK_ACTIONS[number]) => {
    if (action.attachment) {
      setCameraOpen(true);
      return;
    }
    send(action.prompt);
  };

  const pickPhotoFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setPendingPhoto({ uri: result.assets[0].uri, name: result.assets[0].fileName || "photo.jpg" });
      setCameraOpen(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.92 });
    if (!photo.cancelled && photo.uri) {
      setPendingPhoto({ uri: photo.uri, name: `nella-photo-${Date.now()}.jpg` });
      setCameraOpen(false);
    }
  };

  const sendPhoto = () => {
    if (!pendingPhoto) return;
    const media: ChatMedia = { kind: "image", label: pendingPhoto.name, previewUrl: pendingPhoto.uri };
    send(photoCaption.trim() || "Payment photo", media);
    setPhotoCaption("");
    setPendingPhoto(null);
  };

  const startVoice = async () => {
    try {
      const { Audio } = require("expo-av");
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilenceModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingPresets.HIGH_QUALITY);
      await rec.startAsync();
      audioRecording.current = rec;
      const startTime = Date.now();
      setVoiceMode("recording");
      setVoiceSeconds(0);
      voiceInterval.current = setInterval(() => setVoiceSeconds(Math.floor((Date.now() - startTime) / 1000)), 250);
    } catch {
      setVoiceMode("idle");
      setNotice("Couldn’t use the microphone. Check permission and try again.");
    }
  };

  const stopVoice = async () => {
    try {
      const rec = audioRecording.current;
      if (rec) {
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI?.();
        if (uri) {
          setVoiceUrl(uri);
          setVoiceMode("review");
        }
      }
      if (voiceInterval.current) clearInterval(voiceInterval.current);
      audioRecording.current = null;
    } catch {
      setVoiceMode("idle");
    }
  };

  const discardVoice = () => {
    setVoiceMode("idle");
    setVoiceUrl("");
    setVoiceSeconds(0);
    if (voiceInterval.current) clearInterval(voiceInterval.current);
    if (audioRecording.current) {
      try { void audioRecording.current.stopAndUnloadAsync(); } catch {}
      audioRecording.current = null;
    }
  };

  const sendVoice = () => {
    if (!voiceUrl) return;
    const media: ChatMedia = { kind: "audio", label: "Voice note", previewUrl: voiceUrl, durationSeconds: voiceSeconds };
    send("Voice note", media);
    setVoiceUrl("");
    setVoiceMode("idle");
    setVoiceSeconds(0);
  };

  const pickNarration = (msgId: string, pending: any, choice: string | null) => {
    patch(msgId, (m) => (m.card?.kind === "narration" ? { ...m, card: { ...m.card, done: true } } : m));
    if (choice) commit([...msgsRef.current, { id: uid(), role: "user", text: choice, at: Date.now() }]);
    setTimeout(() => {
      nellaSays([{ text: "Please check and approve:", card: { ...pending, ...(choice ? { narration: choice } : {}) } as any }], 500);
    }, 100);
  };

  const reuse = (draft: PaymentDraft) => {
    setApproval(null);
    setPanel(null);
    followsBottom.current = true;
    const turn = startPayment(draft.service, "", user!.name, draft);
    setPayment(turn.state);
    setChatChoices(turn.choices ?? []);
    if (turn.preview) {
      nellaSays([{ text: turn.text, card: { kind: "preview", preview: turn.preview } as any }]);
    } else {
      nellaSays([{ text: turn.text }]);
    }
  };

  const previews = msgs.flatMap((m) => (m.card?.kind === "preview" ? [m.card.preview] : []));
  const lastPrepared = [...previews]
    .reverse()
    .map((p) => draftFromPreview(p))
    .find((d) => d !== null);
  const first = user?.name.split(" ")[0] || "there";
  const empty = msgs.length === 0;

  const handleLogout = async () => {
    setConfirmLogout(false);
    await signOut();
    router.replace("/auth");
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={s.chatSurface}>
      {approval && approval === payment && (
        <PaymentApproval
          theme={theme}
          receipt={paymentPreview(approval.draft, user!.name)}
          draft={approval.draft}
          user={user!}
          onClose={() => setApproval(null)}
          onComplete={() => {
            setApproval(null);
            setPayment(null);
            setChatChoices([]);
            nellaSays([{ text: "Payment approved and submitted via Nella." }], 300);
          }}
          visible={true}
        />
      )}

      <View style={s.header}>
        <View style={s.headerLeft}>
          <NellaMascot theme={theme} size={28} />
        </View>
        <TouchableOpacity style={s.notifButton} onPress={() => setPanel("notifications")}>
          <Bell size={22} strokeWidth={2} style={{ color: theme.colors.mutedForeground }} />
        </TouchableOpacity>
        <TouchableOpacity style={s.profileButton} onPress={() => setProfileOpen(true)}>
          <Text style={s.profileAvatar}>{first.slice(0, 1)}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.conversation}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onTouchStart={() => inputRef.current?.blur()}
      >
        {empty ? (
          <View style={s.emptyState}>
            <NellaMascot theme={theme} size={120} style={s.welcomeMascot} />
            <View style={s.emptyBadge}>
              <Text style={s.emptyBadgeText}>YOUR MONEY, IN A CHAT</Text>
            </View>
            <Text style={s.emptyGreeting}>{greeting()}, {first} 👋</Text>
            <Text style={s.emptySubtitle}>I'm Nella. What can I help you with today?</Text>
            <View style={s.quickActions}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity key={action.label} style={s.quickTile} onPress={() => runQuickAction(action)}>
                  <View style={s.quickIcon}>
                    <action.icon size={24} strokeWidth={2} style={{ color: theme.colors.primary }} />
                  </View>
                  <Text style={s.quickLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button theme={theme} variant="ghost" style={s.voiceNoteBtn} onPress={startVoice}>
              <Mic size={20} strokeWidth={2} style={{ color: theme.colors.primary, marginRight: 6 }} /> Voice note
            </Button>
            <TouchableOpacity style={s.allServices} onPress={() => { setPanel("services"); setProfileOpen(true); }}>
              <Text style={s.allServicesText}>All money services</Text>
              <ArrowUp size={16} strokeWidth={2} style={{ color: theme.colors.primary, marginLeft: 4 }} />
            </TouchableOpacity>
            <Text style={s.emptyFooter}>Preview only · Banking services aren't connected</Text>
          </View>
        ) : (
          <View style={s.msgList}>
            {swipeTip && (
              <View style={s.swipeTip}>
                <Text style={s.swipeTipText}>Tip: swipe a message right to reply, or press and hold to react.</Text>
                <TouchableOpacity style={s.swipeTipDismiss} onPress={() => setSwipeTip(false)}>
                  <Text style={s.swipeTipDismissText}>Got it</Text>
                </TouchableOpacity>
              </View>
            )}
            {msgs.length > visibleCount && (
              <Button theme={theme} variant="outline" style={s.earlierBtn} onPress={() => setVisibleCount((c) => c + 40)}>
                Earlier messages
              </Button>
            )}
            {msgs.slice(-visibleCount).map((m, index, shown) => {
              const g = groupInfo(shown as any, index);
              return (
                <View key={m.id} style={[g.firstInGroup ? {} : s.msgTight]}>
                  {g.newDay && (
                    <View style={s.dayDivider}>
                      <Text style={s.dayLabel}>{dayLabel(m.at)}</Text>
                    </View>
                  )}
                  <View style={[s.messageRow, m.role === "user" ? s.msgUser : s.msgNella]}>
                    {m.role === "nella" && g.lastInGroup && <NellaMascot theme={theme} size={28} style={s.nellaAvatar} />}
                    <View style={s.bubbleWrap}>
                      {m.replyTo && (
                        <View style={s.replyQuote}>
                          <Text style={s.replyQuoteWho}>{m.replyTo.role === "user" ? "You" : "Nella"}</Text>
                          <Text style={s.replyQuoteText}>{m.replyTo.text}</Text>
                        </View>
                      )}
                      {m.media?.kind === "image" && (
                        <View style={s.photoWrap}>
                          <Image source={{ uri: m.media.previewUrl }} style={s.photoImage} />
                          <Text style={s.photoLabel}>Photo attached</Text>
                        </View>
                      )}
                      {m.media?.kind === "audio" && (
                        <View style={s.audioWrap}>
                          <Text style={s.audioLabel}>Voice note</Text>
                        </View>
                      )}
                      {m.text && (
                        <Text style={[s.msgText, m.role === "user" ? s.msgTextUser : s.msgTextNel la]}>{m.text}</Text>
                      )}
                      {m.card?.kind === "balance" && (
                        <View style={s.balanceCard}>
                          <Text style={s.balanceLabel}>Nella wallet</Text>
                          {balance ? (
                            <>
                              <Text style={s.balanceValue}>{naira(balance.available)}</Text>
                              {balance.accountNo && <Text style={s.balanceLabel}>Account: {balance.accountNo}</Text>}
                            </>
                          ) : (
                            <Text style={s.balanceValue}>Your wallet balance is currently unavailable.</Text>
                          )}
                        </View>
                      )}
                      {m.card?.kind === "preview" && (
                        <PaymentPreviewCard theme={theme} receipt={m.card.preview} onEdit={() => {}} />
                      )}
                      {m.card?.kind === "narration" && !m.card.done && ((m.card as any).pending) && (
                        <View style={s.narrationWrap}>
                          {NARRATIONS.map((n) => (
                            <TouchableOpacity key={n} style={s.narrationChip} onPress={() => pickNarration(m.id, (m.card as any).pending, n)}>
                              <Text style={s.narrationChipText}>{n}</Text>
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity style={s.narrationSkip} onPress={() => pickNarration(m.id, (m.card as any).pending, null)}>
                            <Text style={s.narrationSkipText}>Skip</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      {m.card?.kind === "approval" && (
                        <View style={s.approvalCard}>
                          <Text style={s.approvalLabel}>
                            {m.card.service === "transfer" ? "Transfers are currently unavailable." : m.card.service === "airtime" ? "Airtime purchases are currently unavailable." : "Data purchases are currently unavailable."}
                          </Text>
                          <Text style={s.approvalTitle}>{m.card.service === "transfer" ? "Send money" : m.card.service === "airtime" ? "Buy airtime" : "Buy data"}</Text>
                          <Text style={s.approvalAmount}>{naira(m.card.amount)}</Text>
                          <View style={s.approvalRows}>
                            <Row k={m.card.service === "transfer" ? "Account number" : "Phone number"} v={m.card.account} theme={theme} s={s} />
                            <Row k={m.card.service === "transfer" ? "Bank" : "Network"} v={m.card.bank} theme={theme} s={s} />
                            {m.card.narration && <Row k="For" v={m.card.narration} theme={theme} s={s} />}
                          </View>
                          <View style={s.approvalActions}>
                            <TouchableOpacity style={s.cancelBtn} onPress={() => patch(m.id, (x) => ({ ...x, card: { ...(x.card as any), status: "cancelled" } }))}>
                              <Text style={s.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.unavailableBtn}>
                              <Text style={s.unavailableBtnText}>Unavailable</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      {m.card?.kind === "receipt" && (
                        <View style={s.receiptCard}>
                          <View style={s.receiptHeader}>
                            <CircleHelp size={16} strokeWidth={2} style={{ color: theme.colors.mutedForeground }} />
                            <Text style={s.receiptTitle}>Transaction status</Text>
                          </View>
                          <Text style={s.receiptNote}>We couldn't verify this transaction. Check your account before retrying.</Text>
                        </View>
                      )}
                    </View>
                    {g.lastInGroup && <Text style={s.msgTime}>{new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>}
                  </View>
                </View>
              );
            })}
            {newMessages && (
              <Button theme={theme} variant="secondary" style={s.newMessagesBtn} onPress={() => { followsBottom.current = true; setNewMessages(false); void scrollRef.current?.scrollToEnd?.({ animated: true }); }}>
                <ArrowDown size={20} strokeWidth={2} style={{ color: theme.colors.primaryForeground, marginRight: 6 }} /> New messages
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      {!payment && !voiceMode && lastPrepared && (
        <TouchableOpacity style={s.reuseBtn} onPress={() => reuse(lastPrepared!)}>
          <RotateCcw size={16} strokeWidth={2} style={{ color: theme.colors.mutedForeground, marginRight: 6 }} />
          <Text style={s.reuseBtnText}>Prepare again · {SERVICE_LABELS[lastPrepared.service]} · {naira(Number(lastPrepared.amount))}</Text>
        </TouchableOpacity>
      )}

      <NellaServices theme={theme} panel={panel} onChange={setPanel} onBack={() => {}} depth={0} user={user!} previews={previews} onReuse={reuse} />

      <View style={s.composer}>
        {pendingPhoto && (
          <View style={s.photoReview}>
            <View style={s.photoReviewHeader}>
              <TouchableOpacity style={s.photoReviewClose} onPress={() => setPendingPhoto(null)}>
                <X size={24} strokeWidth={2} style={{ color: theme.colors.foreground }} />
              </TouchableOpacity>
              <TouchableOpacity style={s.photoReviewRetake} onPress={() => { setPendingPhoto(null); setCameraOpen(true); }}>
                <Camera size={20} strokeWidth={2} style={{ color: theme.colors.foreground }} /> Retake
              </TouchableOpacity>
            </View>
            <View style={s.photoReviewImageWrap}>
              <Image source={{ uri: pendingPhoto.uri }} style={s.photoReviewImage} />
            </View>
            <View style={s.photoReviewFooter}>
              <TextInput
                style={s.photoCaptionInput}
                value={photoCaption}
                onChangeText={setPhotoCaption}
                placeholder="Add a caption…"
                maxLength={200}
                onSubmitEditing={sendPhoto}
              />
              <TouchableOpacity style={s.photoSendBtn} onPress={sendPhoto}>
                <ArrowUp size={20} strokeWidth={2} style={{ color: theme.colors.primaryForeground }} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        {voiceMode === "recording" && (
          <View style={s.voiceRecording}>
            <View style={s.voiceRecordingText}>
              <View style={s.recDot} />
              <Text>Recording · {voiceSeconds}s</Text>
            </View>
            <Button theme={theme} variant="destructive" style={s.voiceStopBtn} onPress={stopVoice}>Stop & review</Button>
            <TouchableOpacity style={s.voiceCancelBtn} onPress={discardVoice}>
              <X size={20} strokeWidth={2} style={{ color: theme.colors.foreground }} />
            </TouchableOpacity>
          </View>
        )}
        {voiceMode === "review" && (
          <View style={s.voiceReview}>
            <Text style={s.voiceReviewTitle}>Review voice note · {voiceSeconds}s</Text>
            <View style={s.voiceReviewActions}>
              <Button theme={theme} variant="outline" style={s.voiceReviewDiscard} onPress={discardVoice}>Discard</Button>
              <Button theme={theme} variant="outline" style={s.voiceReviewRecordAgain} onPress={() => { discardVoice(); void startVoice(); }}>Record again</Button>
              <Button theme={theme} variant="default" style={s.voiceReviewSend} onPress={sendVoice}>Send voice note</Button>
            </View>
          </View>
        )}
        {offline && (
          <Text style={s.offlineNotice}>You’re offline. This demo can prepare details locally, but messages and payments are not queued or sent to Nella.</Text>
        )}
        {payment && (
          <View style={s.paymentTracker}>
            <View style={s.paymentTrackerSteps}>
              {paymentSteps(payment).map((step) => (
                <View key={step.key} style={[s.trackerStep, step.current ? { backgroundColor: theme.colors.primary } : step.done ? { backgroundColor: theme.colors.secondary } : { backgroundColor: theme.colors.muted }]}>
                  <Text style={[s.trackerStepText, step.current ? { color: theme.colors.primaryForeground } : step.done ? { color: theme.colors.primary } : { color: theme.colors.mutedForeground }]}>
                    {step.done ? "✓ " : ""}{step.label}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.paymentCancel} onPress={() => {
              setPayment(null);
              setChatChoices([]);
              commit([...msgsRef.current, { id: uid(), role: "nella", text: "Payment cancelled. Nothing was sent.", at: Date.now() }]);
            }}>
              <Text style={s.paymentCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {replyingTo && (
          <View style={s.replyBar}>
            <View style={s.replyBarBody}>
              <Text style={s.replyBarWho}>Replying to {replyingTo.role === "user" ? "yourself" : "Nella"}</Text>
              <Text style={s.replyBarText}>{quoteText(replyingTo.text ?? replyingTo.media?.label)}</Text>
            </View>
            <TouchableOpacity style={s.replyBarClose} onPress={() => setReplyingTo(null)}>
              <X size={20} strokeWidth={2} style={{ color: theme.colors.mutedForeground }} />
            </TouchableOpacity>
          </View>
        )}

        {notice && <Text style={s.notice}>{notice}</Text>}

        {cameraOpen && (
          <CameraExpo.CameraView
            ref={cameraRef as any}
            style={s.cameraView}
            facing={cameraType as "back" | "front"}
            flash="off"
          >
            <View style={s.cameraHeader}>
              <Text style={s.cameraTitle}>Snap to pay</Text>
              <TouchableOpacity style={s.cameraClose} onPress={() => setCameraOpen(false)}>
                <X size={24} strokeWidth={2} style={{ color: theme.colors.foreground }} />
              </TouchableOpacity>
            </View>
            <View style={s.cameraControls}>
              <TouchableOpacity style={s.zoomOut} />
              <View style={s.zoomSliderWrap}>
                <Text style={s.zoomValue}>{zoom.toFixed(1)}×</Text>
              </View>
              <TouchableOpacity style={s.zoomIn} />
              <TouchableOpacity style={s.captureBtn} onPress={takePhoto}>
                <Camera size={30} strokeWidth={3} style={{ color: theme.colors.foreground }} />
              </TouchableOpacity>
            </View>
          </CameraExpo.CameraView>
        )}

        <View style={s.inputRow}>
          <TouchableOpacity style={s.attachmentBtn} onPress={() => { setCameraOpen(true); }}>
            <Plus size={24} strokeWidth={2} style={{ color: theme.colors.foreground }} />
          </TouchableOpacity>
          <TextInput
            ref={inputRef as any}
            style={s.input}
            value={text}
            onChangeText={(v) => { setText(v); }}
            placeholder="Message Nella…"
            multiline
            onSubmitEditing={() => { if (text.trim()) send(text); }}
          />
          {text.trim() ? (
            <TouchableOpacity style={s.sendBtn} onPress={() => send(text)}>
              <ArrowUp size={20} strokeWidth={2} style={{ color: theme.colors.primaryForeground }} />
            </TouchableOpacity>
          ) : (
            <VoiceNoteControl theme={theme} mode={voiceMode} onPressStart={startVoice} onPressStop={stopVoice} onPressCancel={discardVoice} />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const quoteText = (text: string | undefined, max = 90) => {
  const clean = (text ?? "Attachment").replace(/\s+/g, " ").trim() || "Attachment";
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

function Row({ k, v, theme, s }: { k: string; v: string; theme: any; s: any }) {
  return (
    <View style={s.row}>
      <Text style={s.rowKey}>{k}</Text>
      <Text style={[s.rowValue, { color: theme.colors.foreground }]}>{v}</Text>
    </View>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    chatSurface: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 12,
      backgroundColor: theme.colors.background,
    },
    headerLeft: { flexDirection: "row", alignItems: "center" },
    notifButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.secondary },
    profileButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.secondary },
    profileAvatar: { fontSize: 16, fontWeight: "bold", color: theme.colors.primary },
    conversation: { paddingHorizontal: 16, paddingVertical: 16, gap: 20 },
    msgList: { flex: 1 },
    messageRow: { flexDirection: "row", alignItems: "flex-end", maxWidth: "90%" },
    msgUser: { flexDirection: "row", alignItems: "flex-end", justifyContent: "flex-end" },
    msgNella: { flexDirection: "row", alignItems: "flex-start" },
    nellaAvatar: { marginRight: 8 },
    bubbleWrap: { maxWidth: "85%" },
    msgText: { fontSize: 15, lineHeight: 22 },
    msgTextUser: { color: theme.colors.primaryForeground, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.colors.primary, borderRadius: 20, borderBottomRightRadius: 4 },
    msgTextNel la: { color: theme.colors.foreground, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
    msgTime: { fontSize: 10, color: theme.colors.mutedForeground, marginTop: 2, alignSelf: "flex-end" },
    msgTight: { marginTop: -8 },
    dayDivider: { alignItems: "center", marginVertical: 8 },
    dayLabel: { fontSize: 11, fontWeight: "600", color: theme.colors.mutedForeground, backgroundColor: theme.colors.muted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    replyQuote: { backgroundColor: "rgba(99, 102, 241, 0.1)", borderLeftWidth: 3, borderLeftColor: theme.colors.primary, padding: 10, borderRadius: 8, marginBottom: 8 },
    replyQuoteWho: { fontSize: 12, fontWeight: "700", color: theme.colors.foreground, marginBottom: 2 },
    replyQuoteText: { fontSize: 13, color: theme.colors.mutedForeground, lineHeight: 18 },
    photoWrap: { backgroundColor: "rgba(0,0,0,0.05)", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 8, marginTop: 8 },
    photoImage: { width: 160, height: 160, borderRadius: 12 },
    photoLabel: { fontSize: 11, color: theme.colors.mutedForeground, marginTop: 4 },
    audioWrap: { backgroundColor: "rgba(0,0,0,0.05)", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 12, marginTop: 8 },
    audioLabel: { fontSize: 11, color: theme.colors.mutedForeground, marginTop: 4 },
    balanceCard: { backgroundColor: theme.colors.primary, borderRadius: 28, padding: 16, marginTop: 8 },
    balanceLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
    balanceValue: { fontSize: 16, fontWeight: "bold", color: theme.colors.primaryForeground },
    narrationWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
    narrationChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.05)", borderWidth: 1, borderColor: theme.colors.border },
    narrationChipText: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground },
    narrationSkip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.secondary },
    narrationSkipText: { fontSize: 14, color: theme.colors.mutedForeground },
    approvalCard: { backgroundColor: "rgba(0,0,0,0.05)", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 28, padding: 16, marginTop: 8 },
    approvalLabel: { fontSize: 11, fontWeight: "600", color: theme.colors.foreground, backgroundColor: "rgba(0,0,0,0.06)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, width: "fit-content", marginBottom: 10 },
    approvalTitle: { fontSize: 12, fontWeight: "600", color: theme.colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
    approvalAmount: { fontSize: 24, fontWeight: "800", color: theme.colors.foreground, marginBottom: 10 },
    approvalRows: { marginBottom: 10 },
    approvalActions: { flexDirection: "row", gap: 6 },
    cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", backgroundColor: theme.colors.card },
    cancelBtnText: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground },
    unavailableBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.colors.muted, alignItems: "center" },
    unavailableBtnText: { fontSize: 14, fontWeight: "bold", color: theme.colors.mutedForeground },
    receiptCard: { backgroundColor: theme.colors.card, borderRadius: 28, padding: 16, marginTop: 8 },
    receiptHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
    receiptTitle: { fontSize: 14, fontWeight: "bold", color: theme.colors.foreground },
    receiptNote: { fontSize: 11, fontWeight: "600", color: theme.colors.foreground, backgroundColor: "rgba(0,0,0,0.06)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginTop: 8 },
    row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
    rowKey: { fontSize: 13, color: theme.colors.mutedForeground },
    rowValue: { fontSize: 13, fontWeight: "600", textAlign: "right" },
    emptyState: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingBottom: 60 },
    welcomeMascot: { marginBottom: 16 },
    emptyBadge: { backgroundColor: theme.colors.secondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
    emptyBadgeText: { fontSize: 11, fontWeight: "600", color: theme.colors.primary, letterSpacing: 1 },
    emptyGreeting: { fontSize: 26, fontWeight: "800", color: theme.colors.foreground, lineHeight: 32, marginBottom: 8 },
    emptySubtitle: { fontSize: 15, color: theme.colors.mutedForeground, lineHeight: 22, textAlign: "center", marginBottom: 28 },
    quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%", justifyContent: "center", marginBottom: 12 },
    quickTile: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
    quickIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(99,102,241,0.15)", alignItems: "center", justifyContent: "center" },
    quickLabel: { fontSize: 13, fontWeight: "600", color: theme.colors.foreground },
    voiceNoteBtn: { marginTop: 10, width: 200 },
    allServices: { flexDirection: "row", alignItems: "center", marginTop: 12 },
    allServicesText: { fontSize: 14, fontWeight: "600", color: theme.colors.primary },
    emptyFooter: { fontSize: 11, color: theme.colors.mutedForeground, marginTop: 12 },
    earlierBtn: { alignSelf: "center", marginTop: 8 },
    newMessagesBtn: { alignSelf: "center", marginTop: 8, marginBottom: 4 },
    swipeTip: { flexDirection: "row", justifyContent: "space-between", gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.secondary, alignSelf: "flex-start", marginLeft: 56 },
    swipeTipText: { fontSize: 12, color: theme.colors.secondaryForeground },
    swipeTipDismiss: { paddingHorizontal: 8, paddingVertical: 4 },
    swipeTipDismissText: { fontSize: 12, fontWeight: "600", color: theme.colors.primary },
    composer: { borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.card, paddingHorizontal: 12, paddingVertical: 10 },
    inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
    attachmentBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.secondary },
    input: { flex: 1, minHeight: 44, maxHeight: 140, borderRadius: 28, backgroundColor: theme.colors.accent, paddingHorizontal: 16, paddingVertical: 10, color: theme.colors.foreground, textAlignVertical: "center" },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center", marginLeft: 4 },
    reuseBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.accent, alignSelf: "flex-start", marginHorizontal: 16, marginTop: 4 },
    reuseBtnText: { fontSize: 12, color: theme.colors.mutedForeground },
    photoReview: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.foreground, zIndex: 100 },
    photoReviewHeader: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
    photoReviewClose: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.1)" },
    photoReviewRetake: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.1)" },
    photoReviewImageWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
    photoReviewImage: { maxWidth: "100%", maxHeight: "60%", borderRadius: 12 },
    photoReviewFooter: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 16 },
    photoCaptionInput: { flex: 1, minHeight: 48, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 24, color: theme.colors.foreground, paddingHorizontal: 16, paddingVertical: 10 },
    photoSendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" },
    voiceRecording: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 10, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.05)", borderWidth: 1, borderColor: theme.colors.border, marginVertical: 4 },
    voiceRecordingText: { flexDirection: "row", alignItems: "center", gap: 8 },
    recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.destructive },
    voiceStopBtn: { flex: 1 },
    voiceCancelBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    voiceReview: { padding: 12, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.05)", borderWidth: 1, borderColor: theme.colors.border, marginVertical: 4 },
    voiceReviewTitle: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground, marginBottom: 8 },
    voiceReviewActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" },
    voiceReviewDiscard: { flex: 1 },
    voiceReviewRecordAgain: { flex: 1 },
    voiceReviewSend: { flex: 1 },
    offlineNotice: { fontSize: 13, color: theme.colors.foreground, backgroundColor: theme.colors.muted, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginVertical: 4 },
    paymentTracker: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card, marginVertical: 4 },
    paymentTrackerSteps: { flex: 1, flexDirection: "row", gap: 2 },
    trackerStep: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    trackerStepText: { fontSize: 10, fontWeight: "600" },
    paymentCancel: { paddingHorizontal: 12, paddingVertical: 4 },
    paymentCancelText: { fontSize: 12, fontWeight: "600", color: theme.colors.destructive },
    replyBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderLeftWidth: 3, borderLeftColor: theme.colors.primary, backgroundColor: "rgba(0,0,0,0.05)", marginVertical: 4 },
    replyBarBody: { flex: 1 },
    replyBarWho: { fontSize: 12, fontWeight: "700", color: theme.colors.foreground },
    replyBarText: { fontSize: 13, color: theme.colors.mutedForeground, lineHeight: 18 },
    replyBarClose: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    notice: { fontSize: 13, color: theme.colors.foreground, backgroundColor: theme.colors.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, marginVertical: 4 },
    cameraView: { flex: 1 },
    cameraHeader: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
    cameraTitle: { fontSize: 16, fontWeight: "600", color: theme.colors.foreground },
    cameraClose: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },
    cameraControls: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 24 },
    zoomOut: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },
    zoomIn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },
    zoomSliderWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
    zoomValue: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground },
    captureBtn: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.foreground },
  });
}
