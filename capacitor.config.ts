import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Nella — native shell for the App Store and Google Play.
 *
 * The web app lives at the repository root and is built into `dist/` by
 * `npm run build:app` (a prerendered SPA — one index.html per route).
 * `webDir` points at that folder; `npm run cap:sync` copies it into the
 * native projects.
 *
 * The bundle id `creative.lantid.nella` is also the App Store / Play Store
 * identity. It is already registered, so never change it after the first
 * submission.
 */
const config: CapacitorConfig = {
  appId: "creative.lantid.nella",
  appName: "Nella",
  webDir: "dist",

  // Matches the app's dark splash background so there is no white flash
  // between the native splash and the web view.
  backgroundColor: "#080D18",

  // The app draws its own safe-area padding with env(safe-area-inset-*).
  // 'never' keeps the web view edge-to-edge so those values are truthful.
  ios: {
    contentInset: "never",
    backgroundColor: "#080D18",
    scrollEnabled: false,
  },

  android: {
    backgroundColor: "#080D18",
    // No mixed content: the app is entirely local, there is nothing to allow.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    // Core SystemBars plugin — the Capacitor 8 replacement for the legacy
    // StatusBar plugin. 'native' makes the web view honour the
    // viewport-fit=cover meta tag so env(safe-area-inset-*) is correct on
    // modern Chromium, which is what the app's CSS already relies on.
    SystemBars: {
      insetsHandling: "native",
      initialViewportFitValueHint: "cover",
      style: "DEFAULT",
      hidden: false,
      animation: "FADE",
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#080D18",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    Keyboard: {
      // The chat composer manages its own viewport, so the web view must not
      // also resize the body — that would fight the visual-viewport shell.
      resize: "none",
    },
  },
};

export default config;
