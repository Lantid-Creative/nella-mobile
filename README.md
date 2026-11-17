# Nella

Nella is a chat-first money companion. This repository holds the mobile-first
web app and the native shells that publish it to the **App Store** and **Google Play**.

- **Web app** — TanStack Start (React 19), mobile-first, built with [Lovable](https://lovable.dev).
- **iOS / Android** — [Capacitor](https://capacitorjs.com) native shells that wrap the same web app.

> The current build is a **demo**: the account, the chat and the payment
> previews live on the device. No real money moves. See
> [docs/store-release.md](docs/store-release.md) for what changes before the
> live release.

## Development

Requires Node.js 22+ and [Bun](https://bun.sh).

```sh
bun install
bun run dev          # dev server
bun run test         # vitest
bun run lint
```

## Builds

There are two builds, and they are different on purpose.

| Command             | What it makes                                                  | Used by         |
| ------------------- | -------------------------------------------------------------- | --------------- |
| `bun run build`     | Server-rendered app (Nitro → Cloudflare Workers)               | Web hosting     |
| `bun run build:app` | Prerendered SPA, one `index.html` per route, copied to `dist/` | The native apps |

The native shell has no server, so `build:app` prerenders every route the app
can land on — `/`, `/auth`, `/chat` and the legal pages — into static HTML the
native WebView can open directly.

## The native apps

```sh
bun run build:app
bunx cap sync                 # copy the web assets into ios/ and android/
bun run cap:open:ios          # open in Xcode
bun run cap:open:android      # open in Android Studio
```

`ios/` and `android/` are generated Capacitor projects and are committed, so a
fresh clone can build without regenerating them.

### Brand assets

The store icons are generated from the mascot in `src/assets/nella-wave.png`
and the colour tokens in `src/styles.css`:

```sh
bun run assets:brand
```

This writes the source artwork to `assets/`, runs `@capacitor/assets` to cut
every iOS/Android/PWA size, and then re-cuts the Android adaptive layers at
the 108dp they need.

### Store screenshots

Every listing screenshot comes from the running app, captured at each store's
exact resolution:

```sh
bun run build:app
bun run screenshots
```

This writes the App Store screenshots to `fastlane/screenshots/`, the Play
screenshots and graphics to `fastlane/metadata/android/`, and needs a Chromium
(Playwright's is reused if present; set `CHROME_PATH` otherwise).

### Release

Fill in `store.config.json` once — the public site URL and a support address —
then release from the terminal:

```sh
gh workflow run store.yml -f platform=both -f mode=release
```

`docs/store-release.md` is the full checklist: the two one-time console steps,
the GitHub secrets, what each lane does, and what has to change before the app
handles real money.

## Lovable

This project is connected to [Lovable](https://lovable.dev).

- Continue developing it in the [Lovable editor](https://lovable.dev/projects/58cac6b8-3f8f-4ed1-9d46-d359292b23c5).
- Push to `main` and your changes sync back into Lovable, ready for your next prompt.
- Avoid rewriting published git history — Lovable mirrors it.
