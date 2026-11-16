# Store release checklist

Everything needed to take Nella from this repository to a live listing on the
**App Store** and **Google Play**.

The app today is a **demo**: the account, the chat history and the payment
previews live on the device and no money moves. That is deliberate — the
release gets the app in front of real people first, and the live banking
services are connected afterwards. The sections marked **Live release** below
are the work that has to happen before the app can handle real money.

---

## 1. Identifiers (already fixed — do not change)

|                                   |                         |
| --------------------------------- | ----------------------- |
| Bundle ID / Application ID        | `creative.lantid.nella` |
| App name                          | Nella                   |
| Version                           | `1.0.0` (build `1`)     |
| iOS deployment target             | 15.0                    |
| Android min / target SDK          | 24 / 36                 |
| Android versionCode / versionName | 1 / 1.0.0               |

`creative.lantid.nella` must already be registered as an App ID on the Apple
Developer portal and as an application in the Play Console. If it is not, the
first submission is blocked until it is.

---

## 2. Accounts

- [ ] **Apple Developer Program** ($99/year) — individual or organisation.
- [ ] **App Store Connect** record for `creative.lantid.nella`.
- [ ] **Google Play Console** developer account ($25 one-off) and an app record
      for `creative.lantid.nella`.
- [ ] A **privacy policy** and a **support URL** that are publicly reachable.
      Both stores reject a listing without them. They must describe Nella, not
      the demo.

---

## 3. CI secrets

Add these in **GitHub → Settings → Secrets and variables → Actions**.

### iOS

| Secret                           | What it is                                                     |
| -------------------------------- | -------------------------------------------------------------- |
| `APP_STORE_CONNECT_KEY_ID`       | The key id (e.g. `ABC123DEFG`) of an App Store Connect API key |
| `APP_STORE_CONNECT_ISSUER_ID`    | The issuer id (a UUID) shown with the key                      |
| `APP_STORE_CONNECT_KEY_CONTENT`  | The `.p8` key file, base64 encoded (`base64 -i AuthKey.p8`)    |
| `APP_STORE_CONNECT_KEY_PASSWORD` | The password you chose when creating the key                   |

Also add a repository **variable** `APPLE_TEAM_ID` with the 10-character Apple
Team ID.

The API key is created in **App Store Connect → Users and Access → Integrations
→ Team Keys**. It needs the _App Manager_ role or higher.

### Android

| Secret                      | What it is                                                    |
| --------------------------- | ------------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | The upload key, base64 encoded (`base64 -i nella-upload.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | Its password                                                  |
| `ANDROID_KEY_ALIAS`         | The key alias, e.g. `nella`                                   |
| `ANDROID_KEY_PASSWORD`      | The key password                                              |
| `PLAY_SERVICE_ACCOUNT_JSON` | The Play Console service account key, base64 encoded          |

The upload key is created once and kept forever — losing it means you cannot
update the listing:

```sh
keytool -genkeypair -v -keystore nella-upload.jks \
  -alias nella -keyalg RSA -keysize 2048 -validity 10000
```

---

## 4. Build and upload

### iOS

```sh
# Locally
bun install
bun run build:app
bunx cap sync ios
bun run cap:open:ios      # then Product → Archive in Xcode
```

In CI, push a tag and the workflow does the rest:

```sh
git tag ios-v1.0.0 && git push origin ios-v1.0.0
```

The workflow archives with Xcode, exports an IPA and uploads it to TestFlight
with `xcrun altool`. The IPA is also saved as a workflow artifact, so it can
always be uploaded by hand through Transporter if `altool` misbehaves on a
future Xcode.

### Android

```sh
git tag android-v1.0.0 && git push origin android-v1.0.0
```

The workflow builds a signed `.aab` and uploads it with the
`r0adkll/upload-google-play` action. The `.aab` is also saved as an artifact.

> Google Play requires a **bundle** (`.aab`), never an `.apk`, for new apps.

---

## 5. App Store listing

- **Name** — `Nella` (30 characters max).
- **Subtitle** — `Your money, in a chat` (30 characters max).
- **Promotional text** — up to 170 characters, editable without a new build.
- **Description** — up to 4000 characters.
- **Keywords** — up to 100 characters, comma separated, no spaces after commas.
- **Primary category** — Finance. **Secondary** — Lifestyle.
- **Support URL** and **Marketing URL**.
- **Privacy Policy URL** — mandatory.
- **Age rating** — the demo collects nothing, so 4+ is right. Re-answer if the
  live release changes this.

### Screenshots

Required device sizes (App Store Connect auto-crops from one upload per size):

- 6.7" iPhone (1290 × 2796) — at least 2
- 6.5" iPhone (1242 × 2688) — at least 2

A good set: the splash, the chat, a payment being prepared, the review card,
the activity list and the profile sheet. Capture them from the simulator or a
real phone with `xcrun simctl io booted screenshot`.

### Icon

`assets/icon-only.png` is the 1024 × 1024 master (no alpha — the App Store
rejects transparency). It is already installed into
`ios/App/App/Assets.xcassets/AppIcon.appiconset`.

### Privacy

- `ios/App/App/PrivacyInfo.xcprivacy` declares: no tracking, no collected data,
  no required-reason APIs. It is already in the Xcode target.
- The App Store **privacy label** must agree with it. With the demo collecting
  nothing, answer "Data Not Collected".

### Review notes (4.2 — minimum functionality)

The app is a native shell around a web app, so tell the reviewer what the
native layer actually does:

> Nella is a mobile money companion. The app is a native WebView shell around
> an offline-first web application, with native camera capture (snap-to-pay),
> native microphone recording (voice notes), native haptics, the Android
> hardware back button and WebAuthn biometric unlock. There is no account
> creation and no payment can be completed: this release is a preview build
> and every transaction is a local preview. No data leaves the device.

---

## 6. Google Play listing

- **App name** — `Nella` (30 characters).
- **Short description** — up to 80 characters.
- **Full description** — up to 4000 characters.
- **Application category** — Finance.
- **Contact email**, **Website**, **Privacy policy URL**.
- **Content rating** questionnaire.
- **Target audience and content** — include 18+ only if the live release adds
  financial products that need it.
- **Data safety** — answer "No data collected" for the demo build. This must
  match the privacy manifest.
- **App access** — if any part of the app is restricted, explain how to reach
  it; the demo is not, so answer "All functionality is available without
  special access".
- **Ads** — declare "No ads".
- **Government apps** and **Health apps** — declare "No" for both.

### Graphics

| Asset             | Size                                                   |
| ----------------- | ------------------------------------------------------ |
| App icon          | 512 × 512 PNG (no alpha)                               |
| Feature graphic   | 1024 × 500 PNG/JPG                                     |
| Phone screenshots | at least 2, 320–3840 px on the long edge, 16:9 or 9:16 |

### Release tracks

Ship to **Internal testing** first, then **Closed testing**, then **Production**.
Google requires a **closed test with at least 12 testers for 14 continuous
days** before a production release for a new personal developer account. Plan
for that window.

---

## 7. Live release — before the app handles real money

The demo is honest about what it is, and that honesty has to survive the
connection to the live services.

- [ ] **A real customer session API.** The old `/api/mobile/*` routes were
      retired on 10 Nov 2026 because they took the phone and PIN in the query
      string and used a session token that never expired. The replacement must
      use a real session (short-lived, revocable) over the `Authorization`
      header. Do not resurrect the old scheme.
- [ ] **Server-owned financial rules.** Quote expiry, fees, limits and
      eligibility must be decided on the server. The app may preview and
      request, never authorise.
- [ ] **Idempotency.** A transfer is submitted once, with an idempotency key,
      and the outcome distinguishes processing / held / unknown / failed /
      sent / reversed. `unknown` must never invite a blind retry.
- [ ] **Private approval.** The PIN is entered in a private form and verified
      by the server, never in chat and never compared in the browser.
- [ ] **Durable events.** Balance, activity, receipts, notifications and
      support all read the same event state, so the app and WhatsApp never
      disagree.
- [ ] **Push notifications.** Needs `@capacitor/push-notifications`, APNs and
      FCM, and a device-token registry on the server.
- [ ] **Secure storage.** Move the session token out of `localStorage` into the
      keychain (iOS) / encrypted storage (Android) via `@capacitor/preferences`
      or the secure-storage plugin.
- [ ] **Update the privacy manifest and the store privacy labels** for the
      data the app now collects. This is a legal change, not a code change.
- [ ] **Update `docs/whatsapp-to-app-coverage.md`** — it is the coverage
      audit and the handoff for this work.

---

## 8. Known gaps in this release

- The app talks to no backend. Everything is local.
- The Google Play upload uses a service account with the **Release manager**
  role, which also needs to be granted to the app in the Play Console.
- `xcrun altool` is deprecated by Apple; if a future Xcode removes it, switch
  the upload step to Transporter or `xcrun iTMSTransporter`.
- No push notifications, no offline mode, no deep links — all listed in the
  plan in `.lovable/plan/`.
