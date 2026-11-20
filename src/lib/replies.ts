// What Nella says when a message is not a money request (19 Nov 2026).
//
// The chat is a client-side conversation: details are gathered here and the
// money is always quoted and executed by the server. This module answers the
// non-money turns — and parses complete one-line payment requests so the
// customer can say "send ₦5,000 to 0123456789 GTBank" in one go.
import type { ChatMsg } from "./chat-store";

const BANKS = [
  "GTBank",
  "Access",
  "Zenith",
  "UBA",
  "First Bank",
  "Opay",
  "Moniepoint",
  "Palmpay",
  "Kuda",
  "Wema",
  "Fidelity",
  "Sterling",
  "Union",
  "Stanbic",
  "FCMB",
  "VFD",
];
const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"];

function parseAmount(t: string): number | null {
  const m = t.replace(/,/g, "").match(/(?:₦|n|naira\s*)?(\d+(?:\.\d+)?)\s*(k)?\b/i);
  const numericAmount = m?.[1];
  if (!numericAmount) return null;
  const n = parseFloat(numericAmount) * (m[2] ? 1000 : 1);
  return n > 0 ? n : null;
}

/** A non-money (or one-line money) turn: text and/or a card to show. */
export function offlineReply(text: string): Omit<ChatMsg, "id" | "at" | "role">[] {
  const t = text.toLowerCase();
  const account = text.match(/\b\d{10}\b/)?.[0];
  const phone = text.match(/\b0[789][01]\d{8}\b/)?.[0];

  if (/voice note|voice message/.test(t))
    return [
      {
        text: "Voice messages can’t be transcribed right now. Please type your request instead.",
      },
    ];

  if (/snapped a bill|payment photo/.test(t))
    return [
      {
        text: "I can’t read payment details from this photo yet. Enter the biller and amount to continue. No payment has been made.",
      },
    ];

  if (/airtime|recharge|data/.test(t)) {
    const service = /data/.test(t) ? "data" : "airtime";
    const amount = parseAmount(text.replace(phone ?? "", ""));
    const net = NETWORKS.find((n) => t.includes(n.toLowerCase()));
    if (!amount || !phone || !net)
      return [
        {
          text: `Tell me the amount, number and network, e.g. "₦1,000 ${service} to 08012345678 MTN".`,
        },
      ];
    return [
      {
        text: "Review your purchase details:",
        card: {
          kind: "approval",
          service,
          amount,
          account: phone,
          bank: net,
          status: "pending",
        },
      },
    ];
  }

  if (/send|transfer|pay\b|sent/.test(t) || account) {
    const amount = parseAmount(text.replace(account ?? "", ""));
    const bank = BANKS.find((b) => t.includes(b.toLowerCase()));
    if (!amount || !account || !bank)
      return [
        {
          text: 'Who should I send to? Type it like "₦5,000 to 0123456789 GTBank". You can also use + to attach a photo, but I can’t read payment details from photos yet.',
        },
      ];
    return [
      {
        text: "Choose a reason for your transfer.",
        card: {
          kind: "narration",
          pending: {
            kind: "approval",
            service: "transfer",
            amount,
            account,
            bank,
            status: "pending",
          },
        },
      },
    ];
  }

  if (/^(hi|hello|hey|good (morning|afternoon|evening))/.test(t))
    return [
      {
        text: "Hi! I'm Nella. I can help with transfers, airtime, data, bills and balance questions. What would you like to do?",
      },
    ];

  return [
    {
      text: 'I didn\'t quite get that. Try "check my balance", "send ₦5,000 to 0123456789 GTBank" or "₦1,000 airtime to 08012345678".',
    },
  ];
}
