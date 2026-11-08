import { View, Text, TextInput, KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { useNellaTheme } from '@/lib/theme-context';
import {
  canEnterChat,
  completeDemoKyc,
  completeOnboarding,
  currentUser,
  normalisePhone,
  resetDemoPin,
  saveKycStep,
  signIn,
  signUp,
  type DemoUser,
} from '@/lib/demo-store';
import { formatPhone, loginPinReady, readSetupDraft, saveSetupDraft, clearSetupDraft } from '@/lib/mobile-ux';
import { Button } from '@/components/ui/button';
import { NellaMascot } from '@/components/nella-mascot';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ScanFace, LockKeyhole, ShieldCheck, Check, UserRound, MapPin } from 'lucide-react-native';
import { biometricsAvailable, biometricPhone, unlockWithBiometrics, enableBiometrics } from '@/lib/biometrics-native';
import { login, isDemoMode } from '@/lib/api-auth';
import { router } from 'expo-router';

const digits = (v: string) => v.replace(/\D/g, '').slice(0, 4);

export default function AuthPage() {
  const { theme } = useNellaTheme();
  const s = createStyles(theme);

  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in');
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bioPhone, setBioPhone] = useState<string | null>(null);
  const [bioBusy, setBioBusy] = useState(false);
  const [kycStep, setKycStep] = useState(0);
  const [draftReady, setDraftReady] = useState(false);
  const isDemo = isDemoMode();

  const first = name.split(' ')[0] || '';

  const restoreUser = (user: any) => {
    setName(user.name);
    setPhone(formatPhone(user.phone));
    setMode('up');
    setKycStep(user.kycStep ?? 0);
    setStep(user.kycSetupComplete ? 4 : 3);
    setPin('');
    setPin2('');
  };

  const resumeAccount = async () => {
    const user = await currentUser();
    if (user && (await canEnterChat(user))) {
      router.replace('/chat');
      return;
    }
    if (user) restoreUser(user);
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const user = await currentUser();
      if (!mounted) return;
      if (user && (await canEnterChat(user))) {
        router.replace('/chat');
      } else if (user) {
        restoreUser(user);
      } else {
        const draft = await readSetupDraft();
        if (draft) {
          setName(draft.name);
          setPhone(draft.phone);
          setMode('up');
          setStep(draft.step);
        }
      }
      setDraftReady(true);
    };
    void init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const initBio = async () => {
      const ok = await biometricsAvailable();
      if (mounted && ok) {
        const bp = await biometricPhone();
        setBioPhone(bp);
      }
    };
    void initBio();
    return () => {
      mounted = false;
    };
  }, [biometricsAvailable, biometricPhone]);

  useEffect(() => {
    let mounted = true;
    const saveDraft = async () => {
      if (mounted && draftReady && mode === 'up' && step < 3) {
        const ok = await saveSetupDraft({ name, phone, step });
        if (!ok && mounted) setError("Couldn't save setup progress. Keep this screen open.");
      }
    };
    void saveDraft();
    return () => {
      mounted = false;
    };
  }, [draftReady, mode, step, name, phone]);

  const switchMode = async (next: typeof mode) => {
    setMode(next);
    const draft = next === 'up' ? await readSetupDraft() : null;
    setStep(draft?.step ?? 0);
    if (draft) {
      setName(draft.name);
      setPhone(draft.phone);
    }
    setPin('');
    setPin2('');
    setError('');
    setSuccess('');
  };

  const unlock = async () => {
    setBioBusy(true);
    setError('');
    const unlocked = await unlockWithBiometrics();
    setBioBusy(false);
    if (!unlocked) {
      setError("Biometric unlock didn't work this time. Use your PIN instead.");
      return;
    }
    try {
      await signInVerified(unlocked);
      await resumeAccount();
    } catch (err: any) {
      setError(err?.message || "Couldn't open your account. Use your PIN instead.");
    }
  };

  const finishSetup = async () => {
    setError('');
    try {
      await completeOnboarding();
      router.replace('/chat');
    } catch (err: any) {
      setError(err?.message || "Could not save your setup. Try again.");
    }
  };

  const finishKyc = async () => {
    setError('');
    try {
      await completeDemoKyc();
      const ok = await biometricsAvailable();
      if (ok && !bioPhone) {
        setStep(4);
        return;
      }
      await finishSetup();
    } catch (err: any) {
      setError(err?.message || "Could not save your KYC setup. Try again.");
    }
  };

  const setupBiometrics = async () => {
    setBioBusy(true);
    setError('');
    try {
      const phoneNumber = normalisePhone(phone);
      if (!phoneNumber) throw new Error("Enter a valid Nigerian phone number.");
      await enableBiometrics(phoneNumber, name);
      setBioPhone(phoneNumber);
      await finishSetup();
    } catch (err: any) {
      setError(err?.message || "Biometric setup failed. Your PIN still works.");
    } finally {
      setBioBusy(false);
    }
  };

  const doLogin = async (value: string) => {
    setError('');
    try {
      // Try live backend first
      try {
        const { login } = await import('@/lib/api-auth');
        await login(phone, value);
        await resumeAccount();
        return;
      } catch {
        // Fall back to demo
      }
      await signIn(phone, value);
      await resumeAccount();
    } catch (err: any) {
      setPin('');
      setError(err?.message || "Couldn't log in. Try again.");
    }
  };

  const handleSubmit = async () => {
    if (mode === 'up' && step === 0) {
      setStep(1);
      return;
    }
    if (mode === 'up' && step === 1) {
      if (name.trim().split(/\s+/).length < 2) {
        setError("Enter your first and last name.");
        return;
      }
      if (!normalisePhone(phone)) {
        setError("Enter a valid Nigerian phone number.");
        return;
      }
      setStep(2);
      return;
    }
    if (mode === 'up' && step === 3) {
      return;
    }
    if (mode === 'up') {
      if (pin !== pin2) {
        setError("The two PINs don't match.");
        return;
      }
      try {
        // Try live backend signup first
        try {
          const { post } = await import('@/lib/api-client');
          await post('/auth/signup', { name, phone, pin }, { auth: false });
          await signIn(phone, pin);
          await clearSetupDraft();
          setPin('');
          setPin2('');
          setKycStep(0);
          setStep(3);
          return;
        } catch {
          // Fall back to demo
        }
        await signUp(name, phone, pin);
        await clearSetupDraft();
        setPin('');
        setPin2('');
        setKycStep(0);
        setStep(3);
      } catch (err: any) {
        setError(err?.message || "Something went wrong. Try again.");
      }
    } else if (mode === 'reset') {
      if (pin !== pin2) {
        setError("The two PINs don't match.");
        return;
      }
      try {
        await resetDemoPin(phone, pin);
        await switchMode('in');
        setSuccess("Your demo PIN has been reset on this device. You can log in now.");
      } catch (err: any) {
        setError(err?.message || "Something went wrong. Try again.");
      }
    } else {
      await doLogin(pin);
    }
  };

  const title =
    mode === 'in'
      ? 'Welcome back.'
      : mode === 'reset'
        ? "Let's get you back in."
        : step === 0
          ? "Hi, I'm Nella."
          : step === 1
            ? "Let's get to know you."
            : step === 3
              ? "Finish your setup."
              : "A PIN, just for you.";
  const subtitle =
    mode === 'in'
      ? "Your money companion is right here."
      : mode === 'reset'
        ? "Reset the demo PIN saved on this device."
        : step === 0
          ? "Your money, in a chat. Let's get you started."
          : step === 1
            ? "What should I call you?"
            : step === 3
              ? "Check your details before meeting Nella."
              : "Choose a 4-digit test PIN to access this demo.";

  const setupStepLabel = step < 2 ? 'Your profile' : step === 2 ? 'Private PIN' : step === 3 ? 'Demo KYC' : 'Device unlock';
  const setupStepNumber = step < 3 ? step + 1 : step === 3 ? 4 + kycStep : 7;

  return (
    <KeyboardAvoidingView behavior="padding" style={s.container}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.card}>
          <View style={s.headerRow}>
            {mode !== 'in' && step < 3 && (
              <TouchableOpacity onPress={() => (mode === 'up' && step > 0 ? (setStep(step - 1), setError('')) : switchMode('in'))}>
                <View style={s.backButton}>
                  <ArrowLeft size={24} strokeWidth={2} style={{ color: theme.colors.foreground }} />
                </View>
              </TouchableOpacity>
            )}
            <NellaMascot theme={theme} size={48} />
          </View>

          {mode === 'up' && (
            <View style={s.stepIndicator}>
              <View style={s.stepRow}>
                <Text style={s.stepLabel}>{setupStepLabel}</Text>
                <Text style={s.stepNumber}>Step {setupStepNumber} of 7</Text>
              </View>
              <View style={s.progressBar}>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <View key={i} style={[s.progressDot, i <= (step < 3 ? step : step === 3 ? 3 + kycStep : 6) ? { backgroundColor: theme.colors.primary } : {}]} />
                ))}
              </View>
            </View>
          )}

          <View style={s.stepContent}>
            {mode === 'up' && step === 3 ? (
              <KycSetup
                name={name}
                phone={normalisePhone(phone) ?? phone}
                step={kycStep}
                onStepChange={async (next: number) => {
                  try {
                    await saveKycStep(next);
                    setKycStep(next);
                    setError('');
                  } catch {
                    setError("Couldn't save your progress. Please try again.");
                  }
                }}
                onComplete={finishKyc}
                error={error}
                theme={theme}
                s={s}
              />
            ) : mode === 'up' && step === 4 ? (
              <View style={s.bioSetup}>
                <View style={s.bioIcon}>
                  <ScanFace size={56} strokeWidth={2} style={{ color: theme.colors.primary }} />
                </View>
                <Text style={s.bioTitle}>Unlock with biometrics.</Text>
                <Text style={s.bioSubtitle}>
                  Next time you open Nella, use your phone's own unlock method — fingerprint, face or pattern — instead of your PIN. Your payment PIN stays separate and is never replaced.
                </Text>
                {error && <Text style={s.errorText}>{error}</Text>}
                <View style={s.buttonRow}>
                  <Button theme={theme} variant="default" disabled={bioBusy} onPress={() => void setupBiometrics()}>
                    {bioBusy ? "Waiting for your device…" : 'Set up biometric unlock'}
                  </Button>
                  <Button theme={theme} variant="outline" onPress={finishSetup}>Maybe later</Button>
                </View>
              </View>
            ) : (
              <>
                <View style={s.greetingRow}>
                  <NellaMascot theme={theme} size={mode === 'up' && step === 0 ? 88 : 48} />
                  {!(mode === 'up' && step === 0) && (
                    <View style={s.greetingBadge}>
                      <Text style={s.greetingText}>
                        {mode === 'in' ? 'Good to see you 👋' : step === 2 ? 'Almost there!' : 'Hello there 👋'}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={s.title}>{title}</Text>
                <Text style={s.subtitle}>{subtitle}</Text>

                <View style={s.form}>
                  {mode === 'up' && step === 0 ? (
                    <View style={s.stepsPreview}>
                      {[
                        ['01', 'A little about you', 'Your name and phone number.'],
                        ['02', 'Your private PIN', 'A test PIN for this demo.'],
                        ['03', 'Required KYC setup', 'Review your identity and sample address before chat.'],
                      ].map(([n, t, d]) => (
                        <View key={n} style={s.stepPreviewItem}>
                          <View style={s.stepPreviewNumber}>{n}</View>
                          <View style={s.stepPreviewText}>
                            <Text style={s.stepPreviewTitle}>{t}</Text>
                            <Text style={s.stepPreviewDesc}>{d}</Text>
                          </View>
                        </View>
                      ))}
                      <View style={s.noticeBox}>
                        <View style={s.noticeIcon}>
                          <ShieldCheck size={16} strokeWidth={2} style={{ color: theme.colors.primary }} />
                        </View>
                        <View style={s.noticeText}>
                          <Text style={s.noticeTitle}>When live account opening is available</Text>
                          <Text style={s.noticeDesc}>
                            You'll verify your NIN, BVN, date of birth and home address in a secure form. Don't send these details in chat. Identity verification isn't connected yet.
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <>
                      {mode === 'up' && step === 1 && (
                        <View style={s.fieldGroup}>
                          <Text style={s.fieldLabel}>Full name</Text>
                          <TextInput
                            autoFocus
                            style={[s.field, { color: theme.colors.foreground }]}
                            placeholder="First and last name"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                          />
                        </View>
                      )}
                      {(mode !== 'up' || step === 1) && (
                        <View style={s.fieldGroup}>
                          <Text style={s.fieldLabel}>Phone number</Text>
                          <View style={s.phoneRow}>
                            <View style={s.countryCode}>+234</View>
                            <TextInput
                              style={[s.fieldInput, { color: theme.colors.foreground }]}
                              keyboardType="numeric"
                              placeholder="801 234 5678"
                              value={phone}
                              onChangeText={(v) => {
                                setPhone(formatPhone(v));
                                setError('');
                              }}
                            />
                          </View>
                        </View>
                      )}
                      {(mode !== 'up' || step === 2) && (
                        <>
                          <View style={s.fieldGroup}>
                            <Text style={s.fieldLabel}>{mode === 'in' ? 'Demo PIN' : 'Create demo PIN'}</Text>
                            <View style={s.pinRow}>
                              <TextInput
                                style={[s.field, { paddingRight: 44, textAlign: 'center', fontFamily: 'monospace', color: theme.colors.foreground }]}
                                secureTextEntry={!showPin}
                                keyboardType="numeric"
                                maxLength={4}
                                placeholder="4-digit PIN"
                                value={pin}
                                onChangeText={(v) => {
                                  const value = digits(v);
                                  setPin(value);
                                  setError('');
                                  if (mode === 'in' && loginPinReady(phone, value)) {
                                    void doLogin(value);
                                  }
                                }}
                              />
                              <TouchableOpacity style={s.togglePinButton} onPress={() => setShowPin(!showPin)}>
                                {showPin ? <EyeOff size={20} strokeWidth={2} style={{ color: theme.colors.mutedForeground }} /> : <Eye size={20} strokeWidth={2} style={{ color: theme.colors.mutedForeground }} />}
                              </TouchableOpacity>
                            </View>
                          </View>
                          {mode !== 'in' && (
                            <View style={s.fieldGroup}>
                              <Text style={s.fieldLabel}>Confirm demo PIN</Text>
                              <TextInput style={[s.field, { textAlign: 'center', fontFamily: 'monospace', color: theme.colors.foreground }]} secureTextEntry={!showPin} keyboardType="numeric" maxLength={4} placeholder="Enter your PIN again" value={pin2} onChangeText={setPin2} />
                            </View>
                          )}
                          {mode === 'in' && (
                            <TouchableOpacity style={s.forgotButton} onPress={() => switchMode('reset')}>
                              <Text style={s.forgotText}>Forgot demo PIN?</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                      {error && <Text style={s.errorText}>{error}</Text>}
                      {success && (
                        <View style={s.successBox}>
                          <Check size={20} strokeWidth={2} style={{ color: theme.colors.primary }} />
                          <Text style={s.successText}>{success}</Text>
                        </View>
                      )}
                      <Button theme={theme} variant="default" onPress={handleSubmit}>
                        {mode === 'in' ? 'Log in' : mode === 'reset' ? 'Reset demo PIN' : step === 0 ? "Let's get started" : step === 1 ? 'Continue' : step === 2 ? 'Create demo account' : 'Complete setup'}
                        <ArrowRight size={20} strokeWidth={2} style={{ color: theme.colors.primaryForeground, marginLeft: 6 }} />
                      </Button>
                      {mode === 'in' && bioPhone && (
                        <Button theme={theme} variant="outline" disabled={bioBusy} onPress={() => void unlock()}>
                          <ScanFace size={18} strokeWidth={2} style={{ color: theme.colors.primary, marginRight: 6 }} />
                          {bioBusy ? "Waiting for your device…" : 'Unlock with biometrics'}
                        </Button>
                      )}
                    </>
                  )}
                </View>

                {mode === 'in' && (
                  <View style={s.newUser}>
                    <Text style={s.newUserText}>New to Nella? </Text>
                    <TouchableOpacity style={s.getStartedButton} onPress={() => switchMode('up')}>
                      <Text style={s.getStartedText}>Get started</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {mode === 'up' && step === 2 && (
                  <Text style={s.pinNote}>
                    Use a unique test PIN, not your banking PIN. This demo stores it on this device only.
                  </Text>
                )}
              </>
            )}
          </View>

          <View style={s.footer}>
            <View style={s.footerRow}>
              <View style={s.lockIcon} />
              <Text style={[s.footerText, { color: theme.colors.mutedForeground }]}>Preview only · No real money moves</Text>
            </View>
            <Text style={[s.footerNote, { color: theme.colors.mutedForeground }]}>Accounts stay on this device. Live banking isn't connected.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function KycSetup({
  name,
  phone,
  error,
  step,
  onStepChange,
  onComplete,
  theme,
  s,
}: {
  name: string;
  phone: string;
  error: string;
  step: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  theme: any;
  s: any;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const titles = ["Let's set up your KYC.", 'Your address details.', "Review your KYC setup."];

  return (
    <View style={s.kycSection}>
      <View style={s.kycHeader}>
        <NellaMascot theme={theme} size={48} />
        <Text style={[s.kycBadge, { backgroundColor: theme.colors.secondary, color: theme.colors.primary }]}>One step at a time</Text>
      </View>
      <Text style={s.kycStepText}>KYC setup · {step + 1} of 3</Text>
      <Text style={s.kycTitle}>{titles[step]}</Text>
      <Text style={s.kycSubtitle}>
        {step === 0
          ? 'Confirm your profile before moving into chat.'
          : step === 1
            ? "For now, we'll use sample address details, not your real address."
            : 'Finish this required demo step before meeting Nella in chat.'}
      </Text>
      <View style={s.kycNoticeBox}>
        <View style={s.kycNoticeIcon}>
          <ShieldCheck size={18} strokeWidth={2} style={{ color: theme.colors.primary }} />
        </View>
        <View style={s.kycNoticeText}>
          <Text style={s.kycNoticeTitle}>Demo KYC · Not identity verification</Text>
          <Text style={s.kycNoticeDesc}>Live verification isn't connected. Don't enter BVN, NIN or upload an ID. No bank account will be opened.</Text>
        </View>
      </View>
      <View style={s.kycDetails}>
        {step === 0 ? (
          <>
            <View style={s.kycDetailsHeader}>
              <UserRound size={18} strokeWidth={2} style={{ color: theme.colors.primary }} />
              <Text style={s.kycDetailsTitle}>Identity details</Text>
            </View>
            <View style={s.detailsList}>
              <DetailRow label="Full name" value={name} theme={theme} s={s} />
              <DetailRow label="Phone number" value={`+234 ${phone}`} theme={theme} s={s} />
              <DetailRow label="Date of birth" value="12 June 1995 · Sample" theme={theme} s={s} />
            </View>
            <Text style={s.kycDetailNote}>
              Your real date of birth and identity checks will be handled securely when live verification is available.
            </Text>
          </>
        ) : step === 1 ? (
          <>
            <View style={s.kycDetailsHeader}>
              <MapPin size={18} strokeWidth={2} style={{ color: theme.colors.primary }} />
              <Text style={s.kycDetailsTitle}>Sample residential address</Text>
            </View>
            <View style={s.detailsList}>
              <DetailRow label="Street" value="12 Example Street" theme={theme} s={s} />
              <DetailRow label="City / State" value="Ikeja, Lagos" theme={theme} s={s} />
              <DetailRow label="Country" value="Nigeria" theme={theme} s={s} />
            </View>
            <Text style={s.kycDetailNote}>
              Sample details only. Your actual home address hasn't been collected or checked.
            </Text>
          </>
        ) : (
          <>
            <View style={s.detailsList}>
              <DetailRow label="Identity details" value="Reviewed · Demo" theme={theme} s={s} />
              <DetailRow label="Address details" value="Reviewed · Sample" theme={theme} s={s} />
              <DetailRow label="Live verification" value="Not connected" theme={theme} s={s} />
            </View>
            <View style={s.ackRow}>
              <TouchableOpacity style={s.checkbox} onPress={() => setAcknowledged((a) => !a)}>
                {acknowledged ? <View style={s.checkmark} /> : <View style={s.checkboxRing} />}
              </TouchableOpacity>
              <Text style={s.ackText}>
                I understand this completes demo KYC setup only, not real identity verification.
              </Text>
            </View>
          </>
        )}
      </View>
      {error && <Text style={s.errorText}>{error}</Text>}
      <View style={s.kycButtons}>
        <Button
          theme={theme}
          variant="default"
          disabled={step === 2 && !acknowledged}
          onPress={() => (step < 2 ? onStepChange(step + 1) : onComplete())}
        >
          {step === 2 ? 'Complete demo KYC setup' : step === 0 ? 'Confirm profile' : 'Review KYC setup'}
          <ArrowRight size={20} strokeWidth={2} style={{ color: theme.colors.primaryForeground, marginLeft: 6 }} />
        </Button>
        {step > 0 && (
          <Button theme={theme} variant="ghost" onPress={() => onStepChange(step - 1)}>
            <ArrowLeft size={20} strokeWidth={2} style={{ color: theme.colors.foreground, marginRight: 6 }} /> Back
          </Button>
        )}
      </View>
    </View>
  );
}

function DetailRow({ label, value, theme, s }: { label: string; value: string; theme: any; s: any }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <View style={s.detailValue}>
        {value.startsWith('Reviewed') && (
          <View style={s.checkInline}>
            <View style={s.checkmarkMini} />
            <Text style={s.checkText}>Reviewed</Text>
          </View>
        )}
        <Text style={s.detailValueText}>{value.replace('Reviewed · ', '').replace('Reviewed ', '')}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, justifyContent: 'center' },
    card: { flex: 1 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    stepIndicator: { marginBottom: 24 },
    stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    stepLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.mutedForeground },
    stepNumber: { fontSize: 12, fontWeight: '600', color: theme.colors.foreground },
    progressBar: { flexDirection: 'row', gap: 4 },
    progressDot: { height: 4, flex: 1, borderRadius: 2, backgroundColor: theme.colors.border },
    stepContent: { marginBottom: 20 },
    bioSetup: { alignItems: 'center' },
    bioIcon: { width: 112, height: 112, borderRadius: 56, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    bioTitle: { fontSize: 28, fontWeight: '800', color: theme.colors.foreground, textAlign: 'center', lineHeight: 34 },
    bioSubtitle: { fontSize: 15, color: theme.colors.mutedForeground, textAlign: 'center', lineHeight: 22, marginHorizontal: 20 },
    errorText: { marginTop: 20, fontSize: 13, color: theme.colors.destructive, textAlign: 'center' },
    buttonRow: { marginTop: 28, gap: 12, width: '100%' },
    greetingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    greetingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.secondary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginLeft: 12 },
    greetingText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
    title: { fontSize: 28, fontWeight: '800', color: theme.colors.foreground, lineHeight: 34, marginBottom: 8 },
    subtitle: { fontSize: 15, color: theme.colors.mutedForeground, lineHeight: 22, marginBottom: 28, textAlign: 'center' },
    form: { gap: 20 },
    fieldGroup: { gap: 6 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.foreground },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    countryCode: { fontSize: 16, fontWeight: '600', color: theme.colors.foreground, backgroundColor: theme.colors.secondary, paddingHorizontal: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.input },
    field: { height: 52, borderWidth: 1, borderColor: theme.colors.input, borderRadius: 12, backgroundColor: theme.colors.card, paddingHorizontal: 16, color: theme.colors.foreground, fontSize: 16 },
    fieldInput: { flex: 1, height: 52, borderWidth: 1, borderColor: theme.colors.input, borderRadius: 12, backgroundColor: theme.colors.card, paddingHorizontal: 16, color: theme.colors.foreground, fontSize: 16, paddingLeft: 0 },
    pinRow: { flexDirection: 'row', alignItems: 'center' },
    togglePinButton: { position: 'absolute', right: 8, top: 8, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.secondary },
    forgotButton: { alignSelf: 'flex-end' },
    forgotText: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
    successBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
    successText: { fontSize: 13, color: theme.colors.primary },
    newUser: { marginTop: 24, alignItems: 'center', flexDirection: 'row', gap: 4 },
    newUserText: { fontSize: 14, color: theme.colors.mutedForeground },
    getStartedButton: {},
    getStartedText: { fontSize: 14, fontWeight: 'bold', color: theme.colors.primary },
    pinNote: { fontSize: 12, color: theme.colors.mutedForeground, lineHeight: 18, textAlign: 'center', marginTop: 8 },
    footer: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, alignItems: 'center' },
    footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    lockIcon: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.15)' },
    footerText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    footerNote: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 4 },
    kycSection: { flex: 1 },
    kycHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    kycBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, fontSize: 14, fontWeight: '600', marginLeft: 12 },
    kycStepText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    kycTitle: { fontSize: 28, fontWeight: '800', color: theme.colors.foreground, lineHeight: 34, marginBottom: 8 },
    kycSubtitle: { fontSize: 15, color: theme.colors.mutedForeground, lineHeight: 22, marginBottom: 24 },
    kycNoticeBox: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, backgroundColor: theme.colors.secondary, marginBottom: 24 },
    kycNoticeIcon: {},
    kycNoticeText: { flex: 1 },
    kycNoticeTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.primary, marginBottom: 4 },
    kycNoticeDesc: { fontSize: 12, color: theme.colors.mutedForeground, lineHeight: 18 },
    kycDetails: { marginBottom: 20 },
    kycDetailsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    kycDetailsTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.foreground },
    detailsList: { borderTopWidth: 1, borderTopColor: theme.colors.border },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    detailLabel: { fontSize: 14, color: theme.colors.mutedForeground },
    detailValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailValueText: { fontSize: 14, fontWeight: '600', color: theme.colors.foreground, textAlign: 'right' },
    checkInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    checkText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
    checkmarkMini: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
    kycDetailNote: { fontSize: 12, color: theme.colors.mutedForeground, lineHeight: 18, marginTop: 12 },
    ackRow: { marginTop: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    checkmark: { width: 10, height: 10, backgroundColor: theme.colors.primary, borderRadius: 3 },
    checkboxRing: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: theme.colors.border },
    ackText: { fontSize: 13, color: theme.colors.mutedForeground, lineHeight: 18 },
    kycButtons: { marginTop: 28, gap: 10, width: '100%' },
    stepsPreview: { gap: 12 },
    stepPreviewItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    stepPreviewNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    stepPreviewText: { flex: 1 },
    stepPreviewTitle: { fontSize: 14, fontWeight: 'bold', color: theme.colors.foreground },
    stepPreviewDesc: { fontSize: 12, color: theme.colors.mutedForeground },
    noticeBox: { flexDirection: 'row', gap: 10, paddingTop: 4, borderTopWidth: 1, borderTopColor: theme.colors.border },
    noticeIcon: {},
    noticeText: { flex: 1 },
    noticeTitle: { fontSize: 12, fontWeight: '600', color: theme.colors.primary, marginBottom: 4 },
    noticeDesc: { fontSize: 12, color: theme.colors.mutedForeground, lineHeight: 18 },
  });
}
