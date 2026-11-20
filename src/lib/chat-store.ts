// The chat's local transcript (19 Nov 2026).
//
// Messages are the customer's own history on this phone: the transcript is
// kept so the conversation survives a restart, but nothing here authorises
// money. A receipt card only ever comes from the server's receipt, and an
// approval card is a set of details awaiting a quote — never a payment.
import type { ReceiptPreview } from "./app-provisions";
import { z } from "zod";
import { readDemoValue, writeDemoValue, STORAGE_NOTICE } from "./demo-storage";

export type ApprovalCard = {
  kind: "approval";
  service: "transfer" | "airtime" | "data" | "electricity" | "cable";
  amount: number;
  account: string;
  bank: string;
  narration?: string | undefined;
  status: "pending" | "approved" | "cancelled";
};

export type Card =
  | { kind: "preview"; preview: ReceiptPreview }
  | { kind: "balance"; amount: string }
  | { kind: "narration"; pending: ApprovalCard; done?: boolean | undefined }
  | ApprovalCard
  | { kind: "receipt"; title: string; amount: number; rows: [string, string][] };

export type ChatMedia = {
  kind: "image" | "audio";
  label: string;
  previewUrl?: string | undefined;
  durationSeconds?: number | undefined;
};

export type AccountUser = { name: string; phone: string };

export type ChatMsg = {
  id: string;
  role: "user" | "nella";
  text?: string | undefined;
  card?: Card | undefined;
  media?: ChatMedia | undefined;
  replyTo?: { id: string; role: "user" | "nella"; text: string } | undefined;
  reactions?: string[] | undefined;
  at: number;
};

const chatKey = (phone: string) => `nella.chat.v2.${phone}`;

const approvalSchema = z.object({
  kind: z.literal("approval"),
  service: z.enum(["transfer", "airtime", "data", "electricity", "cable"]),
  amount: z.number().finite().positive(),
  account: z.string(),
  bank: z.string(),
  narration: z.string().optional(),
  status: z.enum(["pending", "approved", "cancelled"]),
});
const receiptSchema = z.object({
  kind: z.literal("receipt"),
  title: z.string(),
  amount: z.number().finite(),
  rows: z.array(z.tuple([z.string(), z.string()])),
});
const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "nella"]),
  text: z.string().optional(),
  at: z.number().finite(),
  card: z
    .union([
      approvalSchema,
      z.object({ kind: z.literal("preview"), preview: receiptSchema }),
      z.object({ kind: z.literal("balance"), amount: z.string() }),
      z.object({
        kind: z.literal("narration"),
        pending: approvalSchema,
        done: z.boolean().optional(),
      }),
      receiptSchema,
    ])
    .optional(),
  media: z
    .object({
      kind: z.enum(["image", "audio"]),
      label: z.string(),
      previewUrl: z.string().optional(),
      durationSeconds: z.number().finite().optional(),
    })
    .optional(),
  replyTo: z
    .object({ id: z.string(), role: z.enum(["user", "nella"]), text: z.string().max(200) })
    .optional(),
  reactions: z.array(z.string().max(8)).max(5).optional(),
});

/** Normalise Nigerian numbers to 10 digits after +234 (e.g. 8012345678). */
export function normalisePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("234")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return /^[789][01]\d{8}$/.test(d) ? d : null;
}

/** "08012345678" → "+234 801 234 5678"-style input value (10 digits). */
export const nationalPhone = (phone: string): string => {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("234")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
};

/** A number the server will accept: 234 + 10 digits. */
export const e164 = (raw: string): string | null => {
  const local = normalisePhone(raw);
  return local ? `234${local}` : null;
};

const LEGACY_CHAT_COPY: Record<string, string> = {
  "Bill photo · preview only": "Payment photo",
  "Voice note · preview only": "Voice note",
  "I’ve received this voice note in the preview, but I can’t transcribe it here. No audio was uploaded and no payment was started.":
    "Voice messages can’t be transcribed right now. Please type your request instead.",
  "I can’t read payment details from photos in this preview. Please type the biller and amount instead. Nothing has been paid.":
    "I can’t read payment details from this photo yet. Enter the biller and amount to continue. No payment has been made.",
  "Your real activity and receipts will appear here after the live account is connected. This preview does not have transaction history.":
    "Your activity and receipts are currently unavailable.",
  "Support chat isn’t connected in this preview. In the live app, this is where you’ll be able to reach the support team.":
    "Support chat is currently unavailable.",
};

export const loadChat = (phone: string) => {
  const raw = readDemoValue(chatKey(phone));
  const messages: ChatMsg[] = Array.isArray(raw)
    ? raw.flatMap((value) => {
        const parsed = messageSchema.safeParse(value);
        return parsed.success ? [parsed.data] : [];
      })
    : [];
  return messages.map((message): ChatMsg => {
    if (!message.media) {
      if (message.text === undefined) return message;
      const migratedText = LEGACY_CHAT_COPY[message.text];
      return migratedText === undefined ? message : { ...message, text: migratedText };
    }

    const { previewUrl: _previewUrl, ...media } = message.media;
    media.label = message.media.kind === "image" ? "Image attachment" : "Voice attachment";
    const migratedMessage: ChatMsg = { ...message, media };
    if (message.text !== undefined) {
      migratedMessage.text = LEGACY_CHAT_COPY[message.text] ?? message.text;
    }
    return migratedMessage;
  });
};

export const saveChat = (phone: string, msgs: ChatMsg[]) => {
  const persistentMessages = msgs.map((message) => {
    if (!message.media) return message;
    const { previewUrl: _previewUrl, ...media } = message.media;
    media.label = message.media.kind === "image" ? "Image attachment" : "Voice attachment";
    return { ...message, media };
  });
  return writeDemoValue(chatKey(phone), persistentMessages);
};

export { STORAGE_NOTICE };

export const naira = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
