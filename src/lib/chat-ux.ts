import type { PaymentConversation, PaymentField } from "./chat-payments";

type Msg = { role: "user" | "nella"; at: number };
const GROUP_GAP = 2 * 60 * 1000;
const dayKey = (at: number) => new Date(at).toDateString();

/** "Today", "Yesterday" or a short date for conversation dividers. */
export function dayLabel(at: number, now = Date.now()) {
  if (dayKey(at) === dayKey(now)) return "Today";
  if (dayKey(at) === dayKey(now - 86_400_000)) return "Yesterday";
  return new Date(at).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

/** Grouping hints: a divider on a new day, avatar/time only on the last message of a run. */
export function groupInfo(msgs: Msg[], index: number) {
  const m = msgs[index]!;
  const prev = msgs[index - 1];
  const next = msgs[index + 1];
  const newDay = !prev || dayKey(prev.at) !== dayKey(m.at);
  const joinsPrev = !!prev && !newDay && prev.role === m.role && m.at - prev.at < GROUP_GAP;
  const joinsNext = !!next && dayKey(next.at) === dayKey(m.at) && next.role === m.role && next.at - m.at < GROUP_GAP;
  return { newDay, firstInGroup: !joinsPrev, lastInGroup: !joinsNext };
}

export function greeting(hour = new Date().getHours()) {
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

const STEP_LABEL: Record<PaymentField | "review", string> = {
  provider: "Provider",
  destination: "Recipient",
  plan: "Plan",
  amount: "Amount",
  narration: "Reason",
  review: "Review",
};

/** Ordered tracker steps for the active chat payment. */
export function paymentSteps(state: PaymentConversation) {
  const d = state.draft;
  const keys: (PaymentField | "review")[] = [
    "provider",
    "destination",
    ...(["data", "cable", "electricity"].includes(d.service) ? ["plan" as const] : []),
    "amount",
    ...(d.service === "transfer" ? ["narration" as const] : []),
    "review",
  ];
  const current = keys.indexOf(state.field);
  return keys.map((key, i) => ({ key, label: STEP_LABEL[key], done: i < current, current: i === current }));
}

export const filterChoices = (choices: string[], query: string) => {
  const q = query.trim().toLowerCase();
  return q ? choices.filter((c) => c.toLowerCase().includes(q)) : choices;
};
