import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pencil } from 'lucide-react-native';
import type { NellaTheme } from '@/lib/theme';
import { naira } from '@/lib/demo-store';
import type { ReceiptPreview } from '@/lib/app-provisions';
import type { PaymentField } from '@/lib/chat-payments';

interface PaymentPreviewCardProps {
  theme: NellaTheme;
  receipt: ReceiptPreview;
  onEdit?: (field: PaymentField) => void;
}

const fieldFor = (key: string): PaymentField => {
  if (key === 'Bank' || key === 'Provider') return 'provider';
  if (key === 'Narration') return 'narration';
  if (key === 'Plan / package') return 'plan';
  return 'destination';
};

export function PaymentPreviewCard({ theme, receipt, onEdit }: PaymentPreviewCardProps) {
  const s = createStyles(theme);
  return (
    <View style={s.card}>
      <Text style={s.label}>PAYMENT BREAKDOWN</Text>
      <Text style={s.title}>{receipt.title}</Text>
      <View style={s.amountRow}>
        <Text style={s.amount}>{naira(receipt.amount)}</Text>
        {onEdit && (
          <TouchableOpacity style={s.editBtn} onPress={() => onEdit('amount')} activeOpacity={0.8}>
            <Pencil size={16} strokeWidth={2} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={s.rows}>
        {receipt.rows
          .filter(([key]) => ['Recipient account', 'Phone number', 'Meter number', 'Smartcard number', 'Bank', 'Provider', 'Narration', 'Plan / package'].includes(key))
          .map(([key, value]) => (
            <View key={key} style={s.row}>
              <Text style={s.rowKey}>{key}</Text>
              <View style={s.rowValueWrap}>
                <Text style={s.rowValue}>{value}</Text>
                {onEdit && (
                  <TouchableOpacity style={s.editBtn} onPress={() => onEdit(fieldFor(key))} activeOpacity={0.8}>
                    <Pencil size={16} strokeWidth={2} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
      </View>
      <Text style={s.note}>Not submitted · No money has moved.</Text>
    </View>
  );
}

function createStyles(theme: NellaTheme) {
  return StyleSheet.create({
    card: { backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 16 },
    label: { fontSize: 10, fontWeight: 'bold', color: theme.colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    title: { fontSize: 16, fontWeight: '600', color: theme.colors.foreground, marginBottom: 6 },
    amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    amount: { fontSize: 26, fontWeight: '800', color: theme.colors.foreground },
    editBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent },
    rows: { marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
    rowKey: { fontSize: 12, color: theme.colors.mutedForeground },
    rowValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rowValue: { fontSize: 12, fontWeight: '600', color: theme.colors.foreground, textAlign: 'right' },
    note: { fontSize: 11, color: theme.colors.mutedForeground },
  });
}
