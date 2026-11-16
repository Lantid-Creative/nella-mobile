/**
 * Builds the Capacitor app bundle.
 *
 * The web app is server-rendered by default (Cloudflare Workers hosting). The
 * native shell has no server, so this script builds the prerendered SPA
 * variant — one index.html per route the app can land on — and copies it to
 * `dist/`, which is Capacitor's `webDir`.
 *
 * Run with: npm run build:app
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const viteBin = join(dirname(require.resolve("vite/package.json")), "bin", "vite.js");

const build = spawnSync(process.execPath, [viteBin, "build"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NELLA_APP_BUILD: "true" },
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const source = join(root, ".output", "public");
const target = join(root, "dist");

if (!existsSync(join(source, "index.html"))) {
  console.error(
    `[build-app] Expected ${join(source, "index.html")} to exist after the build. ` +
      `Check that the prerender pages in vite.config.ts cover every route.`,
  );
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });

console.log(`[build-app] Copied the prerendered app to ${target}`);
