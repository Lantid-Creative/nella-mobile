export function formatPhone(raw: string) {
  let value = raw.replace(/\D/g, "").slice(0, 14);
  if (value.startsWith("234")) value = value.slice(3);
  value = value.slice(0, value.startsWith("0") ? 11 : 10);
  const first = value.startsWith("0") ? 4 : 3;
  return [value.slice(0, first), value.slice(first, first + 3), value.slice(first + 3)]
    .filter(Boolean)
    .join(" ");
}
export const loginPinReady = (phone: string, pin: string) =>
  /^(?:234|0)?[789][01]\d{8}$/.test(phone.replace(/\D/g, "")) && /^\d{4}$/.test(pin);
