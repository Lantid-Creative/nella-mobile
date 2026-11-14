import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

const WEB_APP_URL = process.env.EXPO_PUBLIC_NELLA_WEB_URL?.trim();

function validWebUrl(value: string | undefined): URL | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const appUrl = useMemo(() => validWebUrl(WEB_APP_URL), []);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const onNavigationStateChange = useCallback((state: WebViewNavigation) => {
    setCanGoBack(state.canGoBack);
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  if (!appUrl) {
    return (
      <View style={styles.centered}>
        <StatusBar style="dark" />
        <Text style={styles.title}>Set the Nella web URL</Text>
        <Text style={styles.body}>
          Add EXPO_PUBLIC_NELLA_WEB_URL to your Expo environment, then restart the app. This keeps the current web UI and UX exactly as it is, without guessing a production URL.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {!failed ? (
        <WebView
          ref={webViewRef}
          source={{ uri: appUrl.toString() }}
          style={styles.webView}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          startInLoadingState
          onLoadStart={() => {
            setLoading(true);
            setFailed(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 500) {
              setLoading(false);
              setFailed(true);
            }
          }}
          onNavigationStateChange={onNavigationStateChange}
          onShouldStartLoadWithRequest={(request) => {
            if (request.url === 'about:blank') return true;

            try {
              const target = new URL(request.url);

              if (target.origin === appUrl.origin) return true;

              if (target.protocol === 'https:' || target.protocol === 'http:' || target.protocol === 'mailto:' || target.protocol === 'tel:') {
                void Linking.openURL(target.href).catch(() => undefined);
              }

              return false;
            } catch {
              return false;
            }
          }}
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          keyboardDisplayRequiresUserAction={false}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={styles.title}>Nella could not load</Text>
          <Text style={styles.body}>Check the network and the configured web URL, then try again.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setFailed(false);
              setLoading(true);
              webViewRef.current?.reload();
            }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {loading && !failed ? (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#5863E8" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  webView: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#F5F7FB',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#101828',
  },
  body: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#475467',
  },
  button: {
    marginTop: 20,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#5863E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 247, 251, 0.75)',
  },
});
