import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useNellaTheme } from '@/lib/theme-context';
import { NellaMascot } from '@/components/nella-mascot';
import { router } from 'expo-router';
import { canEnterChat } from '@/lib/demo-store';
import { getAuthToken } from '@/lib/api-client';

export default function SplashScreen() {
  const { theme } = useNellaTheme();
  const [leaving, setLeaving] = useState(false);
  const token = getAuthToken();

  useEffect(() => {
    const go = async () => {
      setLeaving(true);
      await new Promise((r) => setTimeout(r, 260));
      const user = await canEnterChatCheck(token);
      router.replace(user ? '/chat' : '/auth');
    };
    const timeout = token ? 1200 : 1900;
    const t = setTimeout(go, timeout);
    return () => clearTimeout(t);
  }, [token, router]);

  return (
    <View style={[styles.surface, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.orb} />
        <NellaMascot theme={theme} size={176} style={styles.mascot} />
        <Text style={[styles.logo, { color: theme.colors.foreground }]}>Nella</Text>
        <Text style={[styles.tagline, { color: theme.colors.mutedForeground }]}>Your money, in a chat.</Text>

        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, { animationDelay: `${i * 160}ms` }]} />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View style={styles.lockIcon} />
          <Text style={[styles.footerText, { color: theme.colors.mutedForeground }]}>
            Preview only · No real money moves
          </Text>
        </View>
      </View>
    </View>
  );
}

async function canEnterChatCheck(token: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const { currentUser } = await import('@/lib/demo-store');
    const user = await currentUser();
    return user ? await canEnterChat(user) : false;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 40,
  },
  content: {
    alignItems: 'center',
  },
  orb: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: themeOrb(),
    opacity: 0.7,
    position: 'absolute',
    top: -60,
  },
  mascot: { position: 'relative' },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 16,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  dots: {
    marginTop: 56,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

function themeOrb(): string {
  return '#6366F1';
}
