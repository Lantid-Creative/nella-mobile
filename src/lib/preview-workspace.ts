import { SERVICE_LABELS, type MoneyService, type PaymentDraft, type ReceiptPreview } from './app-provisions';

export function draftFromPreview(preview: ReceiptPreview): PaymentDraft | null {
  const service = (Object.keys(SERVICE_LABELS) as MoneyService[]).find((key) => SERVICE_LABELS[key] === preview.title);
  if (!service) return null;
  const row = (keys: string[]) => preview.rows.find(([key]) => keys.includes(key))?.[1] ?? '';
  return {
    service,
    amount: String(preview.amount),
    destination: row(['Recipient account', 'Phone number', 'Meter number', 'Smartcard number']),
    provider: row(['Bank', 'Provider']),
    narration: row(['Narration']),
    plan: row(['Plan / package']),
  };
}

export function filterPreviews(previews: ReceiptPreview[], query: string, service: MoneyService | 'all') {
  const search = query.trim().toLowerCase();
  return previews.filter(
    (preview) =>
      (service === 'all' || preview.title === SERVICE_LABELS[service]) &&
      (!search || [preview.title, String(preview.amount), ...preview.rows.flat()].join(' ').toLowerCase().includes(search)),
  );
}

export function recipientError(draft: PaymentDraft): string | null {
  if (!draft.provider.trim()) return 'Choose a bank or provider.';
  if (draft.service === 'transfer' && !/^\d{10}$/.test(draft.destination)) return 'Enter a 10-digit account number.';
  if ((draft.service === 'airtime' || draft.service === 'data') && !/^0[789][01]\d{8}$/.test(draft.destination))
    return 'Enter a valid Nigerian phone number.';
  if ((draft.service === 'electricity' || draft.service === 'cable') && !/^\d{6,20}$/.test(draft.destination))
    return 'Enter the meter or smartcard number.';
  if (draft.service === 'electricity' && !draft.plan.trim()) return 'Choose prepaid or postpaid.';
  return null;
}
