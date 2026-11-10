import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNellaTheme } from '@/lib/theme-context';
import { useNellaFonts } from '@/lib/fonts';
import { getAuthToken } from '@/lib/api-client';

export default function RootLayout() {
  const { theme } = useNellaTheme();
  const fontsLoaded = useNellaFonts();
  const token = getAuthToken();

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'default',
      }}
    >
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="auth" />
      <Stack.Screen name="chat" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
});
