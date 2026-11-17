// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The Capacitor native shell (ios/ + android/) has no server to render HTML, so the
// store build is a prerendered SPA: every route becomes a static index.html that the
// native WebView can open directly. The default build stays server-rendered for
// Cloudflare Workers hosting.
const appBuild = process.env["NELLA_APP_BUILD"] === "true";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this.
    server: { entry: "server" },
    ...(appBuild
      ? {
          // The native WebView has no server, so every route the app can land on
          // is prerendered to its own index.html. Client-side navigation between
          // them stays in the SPA, and a cold start on /auth or /chat still loads.
          pages: [
            { path: "/" },
            { path: "/auth" },
            { path: "/chat" },
            // The stores open the policy from the listing; it has to resolve in
            // the native shell too, not just on the web host.
            { path: "/privacy" },
            { path: "/terms" },
            { path: "/support" },
          ],
          prerender: {
            enabled: true,
            autoStaticPathsDiscovery: true,
            crawlLinks: false,
          },
        }
      : {}),
  },
});
