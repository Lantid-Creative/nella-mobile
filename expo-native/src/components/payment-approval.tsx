import { View, Text, TextInput, StyleSheet, TouchableOpacity, useState } from 'react-native';
import { LockKeyhole, ShieldCheck } from 'lucide-react-native';
import type { NellaTheme } from '@/lib/theme';
import { naira } from '@/lib/demo-store';
import type { ReceiptPreview } from '@/lib/app-provisions';
import { Button } from '@/components/ui/button';

interface PaymentApprovalProps {
  theme: NellaTheme;
  receipt: ReceiptPreview;
  user: any;
  onClose: () => void;
  onComplete: () => void;
  visible: boolean;
}

export function PaymentApproval({ theme, receipt, user, onClose, onComplete, visible }: PaymentApprovalProps) {
  const s = createStyles(theme);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(0);

  const close = () => { setPin(''); setError(''); onClose(); };

  const check = (value: string) => {
    setPin('');
    if (value !== user.pin) {
      setError('Incorrect demo PIN. Try again.');
      setShake((n) => n + 1);
      return;
    }
    onComplete();
  };

  const submit = () => { check(pin); };

  if (!visible) return null;

  return (
    <View style={[s.container, { opacity: visible ? 1 : 0 }]}>
      <View style={s.overlay} />
      <View style={s.dialog}>
        <View style={s.dialogHeader}>
          <View style={s.lockIcon}>
            <LockKeyhole size={20} strokeWidth={2} style={{ color: theme.colors.primary }} />
          </View>
          <View style={s.dialogTitleWrap}>
            <Text style={s.dialogTitle}>Approve payment</Text>
            <Text style={s.dialogDesc}>Demo approval only · No money will move</Text>
          </View>
        </View>
        <View style={s.divider} />
        <View style={s.receiptWrap}>
          <Text style={s.receiptTitle}>{receipt.title}</Text>
          <Text style={s.receiptAmount}>{naira(receipt.amount)}</Text>
          <View style={s.receiptRows}>
            {receipt.rows
              .filter(([key]) => ['Recipient account', 'Phone number', 'Meter number', 'Smartcard number', 'Bank', 'Provider', 'Plan / package', 'Narration'].includes(key))
              .map(([key, value]) => (
                <View key={key} style={s.receiptRow}>
                  <Text style={s.receiptRowKey}>{key}</Text>
                  <Text style={s.receiptRowValue}>{value}</Text>
                </View>
              ))}
          </View>
          <Text style={s.receiptNote}>Recipient, availability and fees are not verified.</Text>
        </View>
        <View style={s.form}>
          <Text style={s.pinLabel}>4-digit demo PIN</Text>
          <TextInput
            style={[s.pinInput, shake % 2 === 1 ? s.pinShake : {}]}
            value={pin}
            onChangeText={(v) => {
              const value = v.replace(/\D/g, '').slice(0, 4);
              setPin(value);
              setError('');
              if (value.length === 4) check(value);
            }}
            keyboardType="numeric"
            maxLength={4}
            autoFocus
          />
          <Text style={s.pinNote}>Use the test PIN from your demo account, never your banking PIN.</Text>
          {error && <Text style={s.errorText}>{error}</Text>}
          <Button theme={theme} variant="default" disabled={pin.length !== 4} onPress={submit}>
            <ShieldCheck size={18} strokeWidth={2} style={{ color: theme.colors.primaryForeground, marginRight: 6 }} /> Confirm demo approval
          </Button>
          <Button theme={theme} variant="outline" onPress={close}>Back to chat</Button>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: NellaTheme) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'flex-end' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    dialog: { backgroundColor: theme.colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 24, maxHeight: '85%' },
    dialogHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
    lockIcon: { width: 24, height: 24 },
    dialogTitleWrap: { flex: 1 },
    dialogTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.foreground },
    dialogDesc: { fontSize: 13, color: theme.colors.mutedForeground, marginTop: 2 },
    divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },
    receiptWrap: { paddingHorizontal: 20 },
    receiptTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.foreground },
    receiptAmount: { fontSize: 28, fontWeight: '800', color: theme.colors.foreground, marginTop: 4 },
    receiptRows: { marginTop: 12 },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
    receiptRowKey: { fontSize: 13, color: theme.colors.mutedForeground },
    receiptRowValue: { fontSize: 13, fontWeight: '600', color: theme.colors.foreground, textAlign: 'right' },
    receiptNote: { fontSize: 11, color: theme.colors.mutedForeground, marginTop: 10 },
    form: { paddingHorizontal: 20, gap: 12 },
    pinLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.foreground },
    pinInput: { height: 56, borderWidth: 1, borderColor: theme.colors.input, borderRadius: 12, backgroundColor: theme.colors.card, color: theme.colors.foreground, fontSize: 20, textAlign: 'center', fontFamily: 'monospace' },
    pinShake: {},
    pinNote: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: 2 },
    errorText: { fontSize: 13, color: theme.colors.destructive, marginTop: 4 },
  });
}
