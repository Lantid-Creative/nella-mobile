import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NellaTheme } from '@/lib/theme';
import {
  ArrowLeft, ArrowRight, ArrowDownToLine, Bell, Check, CircleHelp, FileText, Landmark, LockKeyhole, Pencil,
  ReceiptText, ShieldCheck, Smartphone, Wallet, X, ChevronRight,
} from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import type { DemoUser } from '@/lib/demo-store';
import { SERVICE_LABELS, type AppPanel, type PaymentDraft, type ReceiptPreview } from '@/lib/app-provisions';
import { naira } from '@/lib/demo-store';
import { NellaMascot } from '@/components/nella-mascot';
import { PaymentPreviewCard } from '@/components/payment-preview-card';

const TITLES: Record<AppPanel, string> = {
  ...SERVICE_LABELS,
  services: 'What would you like to do?',
  account: 'Your Nella account',
  onboarding: 'Complete your account setup',
  activity: 'Activity & receipts',
  notifications: 'Notifications',
  beneficiaries: 'Your beneficiaries',
  scheduled: 'Scheduled payments',
  security: 'Security & PIN',
  support: 'Help & support',
  insights: 'Spending & statements',
  business: 'Nella for business',
  referrals: 'Referrals & ambassadors',
} as Record<AppPanel, string>;

interface NellaServicesProps {
  theme: NellaTheme;
  panel: AppPanel | null;
  onChange: (panel: AppPanel | null) => void;
  onBack: () => void;
  depth: number;
  user: DemoUser;
  previews: ReceiptPreview[];
  onReuse: (draft: PaymentDraft) => void;
}

export function NellaServices({ theme, panel, onChange, onBack, depth, user, previews, onReuse }: NellaServicesProps) {
  const s = createStyles(theme);

  if (!panel) return null;
  if (panel in SERVICE_LABELS || panel === 'services') return null;

  return (
    <View style={[s.sheet, { backgroundColor: theme.colors.background }]}>
      <View style={s.sheetHeader}>
        <TouchableOpacity style={s.backBtn} onPress={() => (depth > 0 ? onBack() : onChange(null))}>
          <ArrowLeft size={24} strokeWidth={2} style={{ color: theme.colors.foreground }} />
        </TouchableOpacity>
        <View style={s.sheetTitleWrap}>
          <Text style={s.sheetTitle}>{TITLES[panel]}</Text>
          <Text style={s.sheetSubtitle}>Preview · Live banking unavailable</Text>
        </View>
        <TouchableOpacity style={s.closeBtn} onPress={() => onChange(null)}>
          <X size={24} strokeWidth={2} style={{ color: theme.colors.foreground }} />
        </TouchableOpacity>
      </View>
      <View style={s.sheetBody}>{renderPanel(panel)}</View>
    </View>
  );

  function renderPanel(p: AppPanel) {
    switch (p) {
      case 'onboarding':
        return (
          <View style={s.spaceY5}>
            <View style={s.kvRow}>
              <NellaMascot theme={theme} size={32} style={s.mascotSmall} />
              <View>
                <Text style={s.kvTitle}>Hi, {user.name.split(' ')[0]}.</Text>
                <Text style={s.kvSub}>Your demo profile is ready. Your bank account is not open yet.</Text>
              </View>
            </View>
            <View style={s.borderL} />
            <View style={s.checkRow}>
              <Check size={16} strokeWidth={2} style={{ color: theme.colors.primary }} />
              <Text style={s.checkText}>Name, phone & demo PIN</Text>
              <Text style={s.checkSub}>Completed on this device</Text>
            </View>
            <View style={s.checkRow}>
              <ShieldCheck size={16} strokeWidth={2} style={{ color: theme.colors.primary }} />
              <Text style={s.checkText}>Identity verification</Text>
              <Text style={s.checkSub}>Required before a live account can open</Text>
            </View>
            <View style={s.kvList}>
              {[
                ['NIN', '11 digits'],
                ['Date of birth', '18 years or older'],
                ['BVN', '11 digits'],
                ['Home address', 'Street, city and state'],
                ['Payment PIN', '4 digits · entered privately'],
              ].map(([key, value]) => (
                <View key={key} style={s.kvItem}>
                  <Text style={s.kvKey}>{key}</Text>
                  <Text style={s.kvValue}>{value}</Text>
                </View>
              ))}
            </View>
            <View style={s.infoBox}>
              <View style={s.infoIcon}>
                <ShieldCheck size={14} strokeWidth={2} style={{ color: theme.colors.primary }} />
              </View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoTitle}>Verification is not connected</Text>
                <Text style={s.infoDesc}>Do not enter your NIN, BVN or banking PIN in this demo or in chat. A connected secure form and bank verification are required before collecting these details.</Text>
              </View>
            </View>
            <Button theme={theme} variant="default" disabled style={s.disabledBtn}>
              <LockKeyhole size={18} strokeWidth={2} style={{ color: theme.colors.primaryForeground, marginRight: 6 }} /> Verify identity
            </Button>
          </View>
        );
      case 'account':
        return (
          <View style={s.spaceY5}>
            <View style={s.borderB}>
              <Wallet size={24} strokeWidth={2} style={{ color: theme.colors.primary }} style={{ marginBottom: 8 }} />
              <Text style={s.accountLabel}>Available balance</Text>
              <Text style={s.accountValue}>Not available</Text>
            </View>
            <Text style={s.accountTitle}>Account details for bank transfers</Text>
            <View style={s.kvList}>
              {[
                ['Account holder', user.name],
                ['Bank', 'Awaiting account opening'],
                ['Account number', 'Not issued'],
              ].map(([key, value]) => (
                <View key={key} style={s.kvItem}>
                  <Text style={s.kvKey}>{key}</Text>
                  <Text style={s.kvValue}>{value}</Text>
                </View>
              ))}
            </View>
            <View style={s.infoBox}>
              <View style={s.infoIcon}>
                <ShieldCheck size={14} strokeWidth={2} style={{ color: theme.colors.primary }} />
              </View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoTitle}>No funding account yet</Text>
                <Text style={s.infoDesc}>Complete secure identity verification and bank account opening before sending money to Nella. No account number has been generated for this demo.</Text>
              </View>
            </View>
            <Button theme={theme} variant="default" style={s.setupBtn} onPress={() => onChange('onboarding')}>
              View account setup
              <ArrowRight size={16} strokeWidth={2} style={{ color: theme.colors.primaryForeground, marginLeft: 6 }} />
            </Button>
          </View>
        );
      case 'activity':
        return <PreviewActivity theme={theme} previews={previews} onReuse={onReuse} />;
      case 'notifications':
        return (
          <View style={s.spaceY4}>
            <Empty title="Notifications not connected" text="There are no live account notifications in this demo." icon={Bell} theme={theme} s={s} />
            <View style={s.divideY}>
              {[
                'Money received & funding',
                'Transfer processing, success or failure',
                'Airtime, data & bill purchase results',
                'Electricity token & receipt ready',
                'Account opening & verification updates',
                'Business invoice reminders',
                'Support replies & security alerts',
              ].map((label) => (
                <View key={label} style={s.notifyItem}>
                  <Bell size={16} strokeWidth={2} style={{ color: theme.colors.primary, marginTop: 1 }} />
                  <Text style={s.notifyText}>{label}</Text>
                </View>
              ))}
            </View>
            <View style={s.infoBox}>
              <View style={s.infoIcon}>
                <ShieldCheck size={14} strokeWidth={2} style={{ color: theme.colors.primary }} />
              </View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoTitle}>Notifications are not active</Text>
                <Text style={s.infoDesc}>Account events must be connected before alerts can arrive here. Device push permission will only be requested once push delivery is available.</Text>
              </View>
            </View>
          </View>
        );
      case 'beneficiaries':
        return (
          <View style={s.spaceY5}>
            <Empty title="No saved beneficiaries" text="A recipient must be resolved and verified by the bank before you can save them for future payments." icon={Landmark} theme={theme} s={s} />
            <Button theme={theme} variant="default" style={s.sendBtn} onPress={() => onChange('transfer')}>
              Send money in chat
              <ArrowRight size={16} strokeWidth={2} style={{ color: theme.colors.primaryForeground, marginLeft: 6 }} />
            </Button>
          </View>
        );
      case 'security':
        return (
          <View style={s.spaceY4}>
            <View style={s.infoBox}>
              <View style={s.infoIcon}>
                <ShieldCheck size={14} strokeWidth={2} style={{ color: theme.colors.primary }} />
              </View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoTitle}>Keep your PIN private</Text>
                <Text style={s.infoDesc}>Nella must never ask for your payment PIN in the chat. This demo PIN is not a banking PIN.</Text>
              </View>
            </View>
            <View style={s.divideY}>
              {['Change payment PIN', 'Forgot payment PIN', 'Freeze account', 'Recover account'].map((label) => (
                <TouchableOpacity key={label} style={s.actionRow} onPress={() => {}}>
                  <Text style={s.actionLabel}>{label}</Text>
                  <ChevronRight size={16} strokeWidth={2} style={{ color: theme.colors.mutedForeground }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'support':
        return (
          <View style={s.spaceY4}>
            <View style={s.infoBox}>
              <View style={s.infoIcon}>
                <ShieldCheck size={14} strokeWidth={2} style={{ color: theme.colors.primary }} />
              </View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoTitle}>Never share your PIN or OTP</Text>
                <Text style={s.infoDesc}>Describe the issue and include a transaction reference when available.</Text>
              </View>
            </View>
            <Text style={s.fieldLabel}>Issue</Text>
            <View style={s.fieldWrap}>
              <Text style={s.selectText}>Transfer issue</Text>
              <ChevronRight size={16} strokeWidth={2} style={{ color: theme.colors.mutedForeground }} />
            </View>
            <Text style={s.fieldLabel}>Transaction reference <Text style={s.fieldLabelNote}>(optional)</Text></Text>
            <Text style={s.fieldLabel}>What happened?</Text>
            <Button theme={theme} variant="default" style={s.prepareBtn}>Prepare support draft<FileText size={16} strokeWidth={2} style={{ color: theme.colors.primaryForeground, marginLeft: 6 }} /></Button>
          </View>
        );
      case 'insights':
        return (
          <View style={s.spaceY5}>
            <Empty title="No spending data yet" text="Income, spending categories, payment history and statements need verified account transactions." icon={FileText} theme={theme} s={s} />
            <Button theme={theme} variant="default" disabled style={s.disabledBtn}>
              <ArrowDownToLine size={18} strokeWidth={2} style={{ color: theme.colors.primaryForeground, marginRight: 6 }} /> Statement unavailable
            </Button>
            <Button theme={theme} variant="outline" style={s.viewActivity} onPress={() => onChange('activity')}>
              <ReceiptText size={18} strokeWidth={2} style={{ color: theme.colors.primary, marginRight: 6 }} /> View activity
            </Button>
          </View>
        );
      default:
        return (
          <View style={s.spaceY4}>
            <View style={s.infoBox}>
              <View style={s.infoIcon}>
                <ShieldCheck size={14} strokeWidth={2} style={{ color: theme.colors.primary }} />
              </View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoTitle}>Business services</Text>
                <Text style={s.infoDesc}>The original Nella product includes invoice, collection and bulk-payment flows. Business account access and approvals must be connected before using them here.</Text>
              </View>
            </View>
            {[
              'Create & track invoices',
              'Request & collect payments',
              'Payroll & bulk transfers',
              'Business spending & statements',
              'Staff roles & payment approvals',
              'Payment reminders',
            ].map((label) => (
              <View key={label} style={s.notConnectedRow}>
                <Text style={s.notConnectedLabel}>{label}</Text>
                <Text style={s.notConnectedStatus}>Not connected</Text>
              </View>
            ))}
            <Button theme={theme} variant="outline" style={s.businessHelp} onPress={() => onChange('support')}>
              Business account help
              <ArrowRight size={16} strokeWidth={2} style={{ color: theme.colors.primary, marginLeft: 6 }} />
            </Button>
          </View>
        );
    }
  }
}

function PreviewActivity({ theme, previews, onReuse }: { theme: NellaTheme; previews: ReceiptPreview[]; onReuse: (draft: PaymentDraft) => void }) {
  const s = createStyles(theme);
  return (
    <View style={s.spaceY5}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionLabel}>PREPARED PAYMENTS</Text>
        <Text style={s.sectionTitle}>Your prepared payments</Text>
        <Text style={s.sectionSub}>No money has moved. These payments have not been submitted.</Text>
      </View>
      {previews.length > 0 ? (
        <View style={s.divideY}>
          {previews.map((receipt, index) => (
            <TouchableOpacity key={index} style={s.previewItem} onPress={() => onReuse({ service: 'transfer', amount: String(receipt.amount), destination: '', provider: '', narration: '', plan: '' })}>
              <View style={s.previewItemBody}>
                <Text style={s.previewTitle}>{receipt.title}</Text>
                <Text style={s.previewAmount}>{naira(receipt.amount)}</Text>
                <Text style={s.previewNote}>Not submitted</Text>
              </View>
              <ChevronRight size={16} strokeWidth={2} style={{ color: theme.colors.mutedForeground }} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={s.emptyState}>
          <FileText size={32} strokeWidth={2} style={{ color: theme.colors.primary }} />
          <Text style={s.emptyTitle}>No prepared payments yet</Text>
          <Text style={s.emptySub}>Payments you prepare in chat will appear here.</Text>
        </View>
      )}
    </View>
  );
}

function Empty({ title, text, icon: Icon, theme, s }: { title: string; text: string; icon: any; theme: NellaTheme; s: any }) {
  return (
    <View style={s.emptyContainer}>
      <Icon size={32} style={{ color: theme.colors.primary }} />
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{text}</Text>
    </View>
  );
}

function createStyles(theme: NellaTheme) {
  return StyleSheet.create({
    sheet: { flex: 1, maxHeight: '75%' },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.secondary },
    sheetTitleWrap: { flex: 1 },
    sheetTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.foreground },
    sheetSubtitle: { fontSize: 12, color: theme.colors.mutedForeground },
    closeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.secondary },
    sheetBody: { flex: 1, paddingHorizontal: 16, paddingBottom: 24 },
    spaceY5: { gap: 20 },
    spaceY4: { gap: 16 },
    kvRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    mascotSmall: {},
    kvTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.foreground },
    kvSub: { fontSize: 14, color: theme.colors.mutedForeground },
    borderL: { borderLeftWidth: 2, borderLeftColor: theme.colors.primary, paddingLeft: 8, marginVertical: 12 },
    checkRow: { flexDirection: 'column', gap: 4, marginVertical: 8 },
    checkText: { fontSize: 14, fontWeight: 'bold', color: theme.colors.foreground },
    checkSub: { fontSize: 12, color: theme.colors.mutedForeground },
    kvList: { borderTopWidth: 1, borderTopColor: theme.colors.border },
    kvItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    kvKey: { fontSize: 13, color: theme.colors.mutedForeground },
    kvValue: { fontSize: 13, fontWeight: '600', color: theme.colors.foreground },
    infoBox: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, backgroundColor: theme.colors.secondary },
    infoIcon: {},
    infoTextWrap: { flex: 1 },
    infoTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.primary, marginBottom: 4 },
    infoDesc: { fontSize: 12, color: theme.colors.mutedForeground, lineHeight: 18 },
    disabledBtn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.muted, opacity: 0.6 },
    borderB: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    accountLabel: { fontSize: 14, color: theme.colors.mutedForeground },
    accountValue: { fontSize: 20, fontWeight: 'bold', color: theme.colors.foreground },
    accountTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.foreground, marginTop: 10 },
    setupBtn: { height: 52, borderRadius: 12 },
    sendBtn: { height: 52, borderRadius: 12 },
    divideY: { borderTopWidth: 1, borderTopColor: theme.colors.border },
    notifyItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12 },
    notifyText: { fontSize: 14, color: theme.colors.foreground },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
    actionLabel: { fontSize: 14, color: theme.colors.foreground },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.foreground },
    fieldWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.input, borderRadius: 12, backgroundColor: theme.colors.card },
    selectText: { fontSize: 14, color: theme.colors.foreground },
    fieldLabelNote: { fontWeight: '400', color: theme.colors.mutedForeground },
    prepareBtn: { height: 52, borderRadius: 12 },
    sectionHeader: { borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 8 },
    sectionLabel: { fontSize: 10, fontWeight: 'bold', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.foreground, marginBottom: 4 },
    sectionSub: { fontSize: 13, color: theme.colors.mutedForeground },
    previewItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
    previewItemBody: { flex: 1 },
    previewTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.foreground },
    previewAmount: { fontSize: 14, fontWeight: 'bold', color: theme.colors.foreground, marginTop: 2 },
    previewNote: { fontSize: 11, color: theme.colors.mutedForeground },
    emptyContainer: { alignItems: 'center', paddingVertical: 24 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.foreground, marginTop: 8 },
    emptySub: { fontSize: 13, color: theme.colors.mutedForeground, textAlign: 'center', marginTop: 4 },
    emptyState: { alignItems: 'center', paddingVertical: 24 },
    notConnectedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    notConnectedLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.foreground },
    notConnectedStatus: { fontSize: 12, color: theme.colors.mutedForeground },
    businessHelp: { height: 52, borderRadius: 12 },
    viewActivity: { height: 52, borderRadius: 12 },
  });
}
