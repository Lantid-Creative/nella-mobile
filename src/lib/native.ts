/**
 * Native shell wiring for the Capacitor apps (ios/ and android/).
 *
 * Everything in here is a no-op in the browser, so the web build never pulls
 * the Capacitor runtime into the bundle: the plugins are imported dynamically
 * and only after `isNativeShell()` confirms we are inside the native WebView.
 */

/** True when the app is running inside the Capacitor native shell. */
export function isNativeShell(): boolean {
  if (typeof window === "undefined") return false;
  const bridge = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  try {
    return bridge?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

/**
 * The Android hardware back button.
 *
 * Left to itself Capacitor consumes the press even when the WebView has no
 * history left, so the app would trap the customer on the first screen. Own
 * it instead: walk the history back while there is something to go back to
 * (which closes any open sheet — the app pushes a history entry per sheet),
 * and leave the app when there is not.
 */
export async function initBackButton(): Promise<void> {
  if (!isNativeShell()) return;
  const { App } = await import("@capacitor/app");
  await App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
      return;
    }
    void App.exitApp();
  });
}

/**
 * Match the system bars to the app theme.
 *
 * `SystemBarsStyle.Dark` means light bar content on a dark background, which
 * is what the dark theme needs; the light theme is the other way round.
 */
export async function syncSystemBars(dark: boolean): Promise<void> {
  if (!isNativeShell()) return;
  const { SystemBars, SystemBarsStyle } = await import("@capacitor/core");
  await SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light });
}

/**
 * Native haptics. The browser build only has `navigator.vibrate`, which iOS
 * does not implement — the plugin covers both platforms.
 */
export async function nativeHaptic(ms = 8): Promise<void> {
  if (!isNativeShell()) {
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* unsupported */
    }
    return;
  }
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* unsupported */
    }
  }
}
