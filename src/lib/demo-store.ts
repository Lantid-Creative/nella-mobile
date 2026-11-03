// Demo-only storage in this browser (no real backend yet).
export type DemoUser = { name: string; email: string; password: string };
export type ChatMsg = { id: string; role: "user" | "nella"; text: string; at: number };

const USERS = "nella.users";
const SESSION = "nella.session";
const chatKey = (email: string) => `nella.chat.${email}`;

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function signUp(name: string, email: string, password: string) {
  const users = read<DemoUser[]>(USERS, []);
  const e = email.trim().toLowerCase();
  if (users.some((u) => u.email === e)) throw new Error("An account with this email already exists.");
  users.push({ name: name.trim(), email: e, password });
  localStorage.setItem(USERS, JSON.stringify(users));
  localStorage.setItem(SESSION, e);
}

export function signIn(email: string, password: string) {
  const e = email.trim().toLowerCase();
  const u = read<DemoUser[]>(USERS, []).find((x) => x.email === e);
  if (!u || u.password !== password) throw new Error("Wrong email or password.");
  localStorage.setItem(SESSION, e);
}

export function signOut() {
  localStorage.removeItem(SESSION);
}

export function currentUser(): DemoUser | null {
  const e = localStorage.getItem(SESSION);
  if (!e) return null;
  return read<DemoUser[]>(USERS, []).find((u) => u.email === e) ?? null;
}

export const loadChat = (email: string) => read<ChatMsg[]>(chatKey(email), []);
export const saveChat = (email: string, msgs: ChatMsg[]) =>
  localStorage.setItem(chatKey(email), JSON.stringify(msgs));

export function demoReply(text: string): string {
  const t = text.toLowerCase();
  if (/balance/.test(t)) return "Your demo balance is ₦48,250.00. (Sample figure — real balances come once your account is connected.)";
  if (/send|transfer/.test(t)) return "Sure. Who should I send to, and how much? I'll show you a confirmation before any money moves.";
  if (/airtime|data/.test(t)) return "Which network and number? Tell me the amount and I'll prepare it for your approval.";
  if (/bill|nepa|electric|dstv|gotv/.test(t)) return "Which bill would you like to pay? I can help with electricity, TV and internet.";
  if (/hi|hello|hey/.test(t)) return "Hi! I'm Nella. I can help you send money, buy airtime, pay bills and check your balance.";
  return "Got it. In this demo I give sample replies — try asking about your balance, sending money or buying airtime.";
}
