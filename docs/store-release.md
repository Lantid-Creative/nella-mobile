# Store submission

Everything needed to get Nella onto the **App Store** and **Google Play**, and
what is already automated so the release is a terminal command rather than a
click-through.

The app is the **real product**: it signs in to the live Nella service, reads the
customer's VFD Microfinance Bank wallet, and quotes and executes transfers,
airtime, data and bills against it. Everything a reviewer can do is real money
behaviour — so the declarations below describe a financial app, not a demo.

---

## 0. Where the listing points

`store.config.json` is filled in and committed. Every URL the stores open is
derived from it, so the app, the listing and the marketing site cannot disagree:

```json
{
  "siteUrl": "https://usenella.com",
  "supportEmail": "support@usenella.com",
  "paths": {
    "support": "/support",
    "privacy": "/privacy-policy",
    "terms": "/terms-of-service",
    "security": "/security"
  },
  "copyright": "2026 Harrena Africa Synergy LTD",
  "appVersion": "1.0.0"
}
```

| Listing field | Resolves to                           |
| ------------- | ------------------------------------- |
| Support URL   | `https://usenella.com/support`        |
| Privacy URL   | `https://usenella.com/privacy-policy` |
| Marketing URL | `https://usenella.com`                |
| Copyright     | `2026 Harrena Africa Synergy LTD`     |

Those four pages are live. The pipeline still refuses to run if any URL falls
back to the `.example` placeholder, because a dead support or privacy link is an
automatic rejection. Change a path only if the site moves it, then commit — do
not edit the URL anywhere else.

The app also ships its own `/privacy`, `/terms` and `/support` pages. They
describe what _this build_ does on the phone and link out to the canonical
documents above; they deliberately do not restate them.

## 1. What is already done

|                            |                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Bundle ID / Application ID | `creative.lantid.nella` (never change it after the first submission)                                              |
| Version                    | `1.0.0`; iOS build number comes from the CI run number, Android `versionCode` is overridable with `-PversionCode` |
| Platforms                  | iPhone only (`TARGETED_DEVICE_FAMILY = 1`), iOS 15+, Android 7.0+ (minSdk 24), target SDK 36                      |
| Icons and splash           | generated from the Nella mascot — `bun run assets:brand`                                                          |
| Screenshots                | 6.9" + 6.5" iPhone and 1080×1920 Android, captured from the running app — `bun run screenshots`                   |
| Play graphics              | 1024×500 feature graphic and 512×512 icon — also `bun run screenshots`                                            |
| Listing text               | in `fastlane/metadata/`, within every store character limit                                                       |
| Privacy manifest           | `ios/App/App/PrivacyInfo.xcprivacy` — name, phone, user id, financial info, sensitive identity info; no tracking    |
| Export compliance          | `ITSAppUsesNonExemptEncryption = false` in `Info.plist`                                                           |
| Camera / microphone        | usage strings on iOS, permissions on Android                                                                      |
| Upload uploads             | `fastlane/Fastfile` lanes for both stores, called by `.github/workflows/store.yml`                                |

The build machine here has no Xcode, no Java and no Android SDK, so **the native
builds run on GitHub Actions**. That is not a workaround — it is also how the
release should be made, because it keeps one signing identity in one place.

The repository is **public**, which is what makes this practical: public repos get
unlimited Actions minutes, while a private repo on the free plan includes roughly
200 macOS minutes a month and puts macOS jobs at the back of the queue. Everything
sensitive lives in Actions secrets, never in the tree — see [§3](#3-put-the-credentials-in-github).

---

## 2. The two one-time browser steps

The store APIs cannot create an app record or accept a legal agreement. These
have to be done once, by you, in a browser. Nothing else needs a browser.

### App Store Connect

The account is connected: the API key is in `APP_STORE_CONNECT_KEY_ID`,
`APP_STORE_CONNECT_ISSUER_ID` and `APP_STORE_CONNECT_KEY_CONTENT`, and
`APPLE_TEAM_ID` is the repository variable `B9SBM56TX4`.

| Thing        | State                                                   |
| ------------ | ------------------------------------------------------- |
| Team ID      | `B9SBM56TX4`                                            |
| API key      | `4STQXVTD84`, App Manager — already in GitHub secrets   |
| Bundle ID    | `creative.lantid.nella` — registered, seed `B9SBM56TX4` |
| App record   | **does not exist yet** — this is the one step left      |
| Name `Nella` | free on the App Store (checked US, NG, GB storefronts)  |

**The remaining step, and the only one:**

1. <https://appstoreconnect.apple.com> → **My Apps → + → New App**
   - Platform **iOS**, name **Nella**, primary language **English (U.S.)**
   - Bundle ID **`creative.lantid.nella`** (it is already registered, so it
     appears in the list — do not create a new one)
   - SKU: `nella-ios`
2. **Agreements, Tax, and Banking** → make sure the free-app agreement is
   **Active**. The build cannot be attached to a version otherwise.

Apple has no API for creating an app, which is why this cannot be scripted. Every
other field on the version page is in [§2b](#2b-every-field-only-the-console-can-fill).

### Google Play Console

1. <https://play.google.com/console> — register ($25 one-off) if you have not.
2. **Create app** → name **Nella**, default language **English (United States)**,
   App, Free. Package name **`creative.lantid.nella`** cannot be changed later.
3. **Setup → API access** → link a Google Cloud project → create a service
   account with the **Release manager** role, then create and download a JSON
   key. Grant that service account access to the Nella app in
   **Users and permissions**.
4. The upload key already exists on this machine at `~/.nella-keys/` (see
   `passwords.txt` there) and its four GitHub secrets are already set. **Back
   that folder up somewhere offline** — after the first upload it is the only
   key Play will accept for updates. If you ever rebuild it:

   ```sh
   openssl req -x509 -newkey rsa:2048 -nodes -days 10000 \
     -keyout ~/.nella-keys/upload-key.pem -out ~/.nella-keys/upload-cert.pem \
     -subj "/CN=Nella Upload/O=Lantid Creative/C=NG"
   openssl pkcs12 -export -inkey ~/.nella-keys/upload-key.pem \
     -in ~/.nella-keys/upload-cert.pem -name nella \
     -out ~/.nella-keys/nella-upload.p12
   ```

   A PKCS12 store generated by openssl works exactly like a `keytool` JKS and
   needs no JDK, which is why the pipeline uses one. Play accepts either.

---

## 2b. Every field only the console can fill

The APIs cannot complete these, and a submission stays stuck until each one is
answered. Every answer below is correct for **this** build — copy them as-is.

### App Store Connect — the version page

| Field          | Answer                                                                       |
| -------------- | ---------------------------------------------------------------------------- |
| Category       | Finance (secondary: Utilities)                                               |
| Age rating     | 4+ — no objectionable content, no user-generated content, no gambling        |
| Price          | Free, all territories                                                        |
| App Privacy    | **Data is collected** — see the table below                                  |
| Content rights | Does not contain third-party content                                         |
| Encryption     | Already declared in the build; nothing to answer here                        |
| Review notes   | Use the text in [§5](#app-review-notes-paste-this-into-the-review-notes-box) |
| Demo account   | Not needed — "Get started" has no sign-in                                    |

**App Privacy** is the one that gets submissions rejected when it is skipped or
when it disagrees with the build. Answer _yes, we collect data_, **linked to the
user's identity**, **not used for tracking**, for **App Functionality** only:

| Data type          | Collected | Linked | Tracking | Purpose          |
| ------------------ | --------- | ------ | -------- | ---------------- |
| Name               | Yes       | Yes    | No       | App Functionality |
| Phone Number       | Yes       | Yes    | No       | App Functionality |
| User ID            | Yes       | Yes    | No       | App Functionality |
| Financial Info     | Yes       | Yes    | No       | App Functionality |
| Sensitive Info     | Yes       | Yes    | No       | App Functionality |

This matches `ios/App/App/PrivacyInfo.xcprivacy` and the policy at
`https://usenella.com/privacy-policy`. Payments are made to a bank account the
customer holds with VFD Microfinance Bank; the BVN/NIN is collected once, during
account opening, and is what "Sensitive Info" covers. The app has no analytics,
no advertising SDK and no tracking domains.

### Google Play Console — App content

Everything under **Policy → App content** has to be green before Production:

| Declaration                 | Answer                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Privacy policy              | `https://usenella.com/privacy-policy`                                                                          |
| App access                  | **Restricted** — sign-in required. Provide the demo account in the App access declaration.                      |
| Ads                         | No ads                                                                                                         |
| Content rating              | Fill the questionnaire: no violence, sex, language, drugs, gambling, or user interaction → expect **Everyone** |
| Target audience             | 18 and over                                                                                                    |
| News app                    | No                                                                                                             |
| Data safety                 | **Data collected and shared** — see the table below; encrypted in transit; no tracking                         |
| Government app              | No                                                                                                             |
| Financial features          | **Money transfer + digital wallet**, operated with a licensed partner (VFD Microfinance Bank)                    |
| Health                      | No                                                                                                             |
| Photo and video permissions | Camera is used only for bill capture started by the user; nothing is uploaded                                  |
| Microphone permissions      | Used only while the user holds to record a voice note                                                          |

Play's **Data safety** form must list, for each data type: collected, shared,
encrypted in transit, and whether it is required. The honest answer for this
build:

| Data type                   | Collected | Shared | Purpose                              |
| --------------------------- | --------- | ------ | ------------------------------------ |
| Name                        | Yes       | Yes    | Account management, app functionality |
| Phone number                | Yes       | Yes    | Account management, app functionality |
| User IDs                    | Yes       | No     | Account management                    |
| Financial info              | Yes       | Yes    | App functionality                     |
| Government ID / other info   | Yes       | Yes    | Account management, fraud prevention  |
| App activity (in-app history) | Yes     | No     | App functionality                     |

"Shared" means it reaches VFD Microfinance Bank (the account provider and the
payment rail), the biller/network being paid, and identity-verification and
fraud-prevention providers — never advertisers, and never sold. Both stores
compare these answers against the build, and the privacy policy has to say the
same thing in the same release.

### Apple, once per account

- **Agreements, Tax, and Banking** — the free-app agreement must be _Active_,
  or the build cannot be attached to a version.
- **App Store Server Notifications / paid apps** — not needed; there is no
  purchase in this build.

### Google, once per account

- A **personal** developer account created after November 2023 must run a
  closed test with **12 testers for 14 continuous days** before it can publish
  to Production. Start the internal track now so the clock runs.

## 3. Put the credentials in GitHub

Run these from the repository root. `gh` must be authenticated
(`gh auth status`).

```sh
# ---- Apple ----------------------------------------------------------------
gh secret set APP_STORE_CONNECT_KEY_ID      --body "ABC123DEFG"
gh secret set APP_STORE_CONNECT_ISSUER_ID   --body "00000000-0000-0000-0000-000000000000"
gh secret set APP_STORE_CONNECT_KEY_CONTENT --body "$(cat ~/Downloads/AuthKey_ABC123DEFG.p8)"

# The 10-character team id from App Store Connect → Membership.
gh variable set APPLE_TEAM_ID --body "ABCDE12345"

# ---- Google ---------------------------------------------------------------
# These four are already set. Re-run them only if you regenerate the key.
gh secret set ANDROID_KEYSTORE_BASE64    --body "$(base64 -i ~/.nella-keys/nella-upload.p12)"
gh secret set ANDROID_KEYSTORE_PASSWORD  --body "$(awk '/^storePassword/ {print $2}' ~/.nella-keys/passwords.txt)"
gh secret set ANDROID_KEY_ALIAS          --body "nella"
gh secret set ANDROID_KEY_PASSWORD       --body "$(awk '/^storePassword/ {print $2}' ~/.nella-keys/passwords.txt)"

# Still needed: the Play service account you create in §2.
gh secret set PLAY_SERVICE_ACCOUNT_JSON  --body "$(cat ~/Downloads/play-service-account.json)"
```

Check what landed:

```sh
gh secret list
gh variable list
```

> `base64 -i` is the macOS form. On Linux use `base64 -w0`.

---

## 4. Release from the terminal

```sh
# Compile both apps without touching either store. No accounts needed — run
# this first, it proves the toolchain and the signing key are wired up.
gh workflow run store.yml -f platform=both -f mode=build

# Both stores: build, upload, and submit for review.
gh workflow run store.yml -f platform=both -f mode=release

# One store at a time.
gh workflow run store.yml -f platform=ios     -f mode=release
gh workflow run store.yml -f platform=android -f mode=release

# Push only the listing text and screenshots — no build, no new version.
gh workflow run store.yml -f platform=both -f mode=listing

# Watch it.
gh run watch
```

`mode=release` does, per store:

- **iPhone** — archives with the App Store distribution profile, uploads the
  build, pushes the listing and screenshots, and submits the version for review.
  The IPA is kept as a workflow artifact.
- **Android** — builds a signed `.aab`, uploads it to the **internal** track as a
  **draft** with the listing and graphics. The AAB is kept as an artifact.

Tagging works too, if you prefer a release to be a version:

```sh
git tag ios-v1.0.0     && git push origin ios-v1.0.0
git tag android-v1.0.0 && git push origin android-v1.0.0
```

### Why Android stops at "draft"

Play will not let a release go live until the console has a **content rating**
and a **data safety** declaration, and neither can be filled through the API.
Fill them once in the console:

- **Content rating** → answer the questionnaire. No user-generated content, no
  ads, no gambling, no purchases → expect _Everyone / PEGI 3_.
- **Data safety** → collected and shared, as in the table in §2b; encrypted in
  transit; no tracking.
- **App access** → _Restricted_: sign-in required. Add the demo account
  (`+2348012345678` / `1234`) in the declaration.
- **Ads** → No.
- **Government apps / Health apps** → No.

After that, promote the draft to **Production** in the console (or set
`PLAY_RELEASE_STATUS=completed` on a later run once the app is already public).

> A new **personal** Play developer account also has to run a closed test with at
> least 12 testers for 14 continuous days before Production. Start the internal
> track now so that clock runs while you finish the listing.

---

## 5. Listing content

The text is in the repository, so you can paste it straight into the console if
you ever need to upload by hand:

| Field                     | File                                                                        |
| ------------------------- | --------------------------------------------------------------------------- |
| App name                  | `fastlane/metadata/ios/en-US/name.txt`                                      |
| Subtitle                  | `fastlane/metadata/ios/en-US/subtitle.txt`                                  |
| Description               | `fastlane/metadata/ios/en-US/description.txt`                               |
| Keywords                  | `fastlane/metadata/ios/en-US/keywords.txt`                                  |
| Promotional text          | `fastlane/metadata/ios/en-US/promotional_text.txt`                          |
| What's new                | `fastlane/metadata/ios/en-US/release_notes.txt`                             |
| Play title / short / full | `fastlane/metadata/android/en-US/*.txt`                                     |
| Screenshots               | `fastlane/screenshots/en-US/` and `fastlane/metadata/android/en-US/images/` |

Only two things are console-only:

- **Category** — App Store: Finance (secondary Lifestyle). Play: Finance.
- **Pricing** — free, all territories.

If you change the copy, edit the files and re-run `mode=listing`; do not retype
it in the console, or the two drift apart.

### App Review notes (paste this into the review notes box)

> Nella is a chat-first money app. Customers hold a real Nigerian wallet with VFD
> Microfinance Bank, and the app signs in to that account to send money, buy
> airtime and data, and pay bills. The app is a Capacitor shell around the Nella
> web app, with native camera capture, microphone recording, haptics, the Android
> hardware back button and WebAuthn device unlock.
>
> Sign in with the demo account below. It is a real account on our live service
> with a small test balance, so every flow can be exercised end to end:
>
> Phone: +234 801 234 5678
> PIN: 1234
>
> Please do not send money to arbitrary accounts — the transfer screen validates
> a recipient name with the bank before a payment can be quoted. Bills and
> airtime also work. New accounts are opened with our team on WhatsApp
> (https://wa.me/2348079574994) rather than inside the app, which is why there is
> no in-app sign-up; PIN resets go through the same channel.

### Screenshots

`bun run screenshots` regenerates all of them from the running app:

- 6.9" iPhone — 1320×2868
- 6.5" iPhone — 1242×2688
- Android phone — 1080×1920
- Play feature graphic 1024×500, icon 512×512

It drives the real UI and captures six scenes per device:

| File          | Scene                                                            |
| ------------- | ---------------------------------------------------------------- |
| `01-welcome`  | Sign in with phone and PIN                                       |
| `02-chat`     | The chat greeting and the money quick actions                    |
| `03-transfer` | A transfer being prepared, with the progress tracker             |
| `04-review`   | The payment breakdown before approval                            |
| `05-receipt`  | A receipt opened from its reference                              |
| `06-balance`  | Wallet balance and the last transactions                         |

Each shot seeds a signed-in session in local storage and answers the API with
fixtures in the script, so the pixels are the real UI and no request reaches
production. If the UI changes, re-run it — never ship screenshots of a build
that no longer exists.

---

## 6. If a run fails

| Symptom                                                   | Cause                                                                                                                                                                                                                                   |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store.config.json still holds the placeholder siteUrl`   | Fill in §0.                                                                                                                                                                                                                             |
| iOS: `No profiles for 'creative.lantid.nella' were found` | `APPLE_TEAM_ID` is wrong or the App ID is not registered.                                                                                                                                                                               |
| iOS: authentication error                                 | The `.p8` in `APP_STORE_CONNECT_KEY_CONTENT` must be the raw file contents, and the key needs App Manager.                                                                                                                              |
| Android: `Version code 1 has already been used`           | Bump: `./gradlew bundleRelease -PversionCode=2`.                                                                                                                                                                                        |
| Android: `Package not found`                              | The app record does not exist yet, or the service account was not granted access to it.                                                                                                                                                 |
| Play rejects the listing                                  | The content rating or data safety declaration is still empty.                                                                                                                                                                           |
| Play: `The caller does not have permission`               | The service account was not granted access to the app in **Users and permissions**, or lacks the Release manager role.                                                                                                                  |
| Play refuses the very first upload                        | A brand-new app sometimes needs its first release uploaded by hand so Play App Signing can be enrolled. Download the run's `Nella-android-aab` artifact, upload it in the console, then let the workflow handle every release after it. |
| iOS: `Could not find option 'api_key'`                    | A lane is passing an option gym does not accept. Signing is handed to xcodebuild through `xcargs`; see `signing_xcargs` in the Fastfile.                                                                                                |
| iOS: `No signing certificate "iOS Distribution" found`    | The API key cannot create certificates. Give the key the **App Manager** role, or create a distribution certificate once in Xcode with the same team.                                                                                   |

---

## 7. What is live in 1.0

The mobile surface is `/api/mobile/v1`. The old `/api/mobile/*` routes were
retired on 10 Nov 2026 (phone + PIN in the query string, tokens that never
expired) and a deny-by-default gate keeps them closed — `src/lib/mobile-gate.ts`.

- **Sessions.** PIN login returns a short-lived access token and a rotating
  refresh token bound to the device id. A replayed refresh fails; a refresh from
  another device id revokes the session. Logout revokes both.
- **Server-owned money.** Quotes, fees, limits, fraud holds and balances are
  computed on the server and the approval is parked there; the app only ever
  holds a reference. The PIN is verified server-side.
- **Bills and receipts.** The catalogue is VFD's own list, cleaned and
  de-duplicated per request. Purchases park in `onboarding.pendingBillMobile` so
  a chat approval waiting on the same account is never clobbered. Receipts are
  rebuilt from the ledger by `buildReceipt`.
- **Honest copy.** The app says the bank provides the service, never promises a
  licence it does not have, and routes account opening and PIN resets to a human
  on WhatsApp.

Still open, and worth doing before the app is promoted:

- [ ] **Secure storage.** Move the session out of `localStorage` into the iOS
      keychain / Android encrypted storage.
- [ ] **Push notifications.** `@capacitor/push-notifications`, APNs, FCM and a
      device-token registry on the server.
- [ ] **In-app statement download** (the receipt PDF endpoint exists; the app
      does not surface it yet).
- [ ] **Update `docs/whatsapp-to-app-coverage.md`**, the coverage audit and
      handoff for this work.

## 8. Known gaps in this release

- No push notifications, no offline caching and no deep links.
- The session lives in web storage, not the platform keychain (see §7).
- Play's content rating and data safety are console-only, so the first Android
  release lands as a draft.
- The privacy manifest, both privacy labels and the policy text describe the
  same data today; they must keep changing together.
- The **dev** stack runs against the VFD sandbox, whose bills catalogue is
  incomplete: MTN and GLO airtime have no items there (only `CS_MTN` with zero
  offers, plus the data bundles), while the production catalogue has one open
  airtime item per network. Quote airtime against production before calling an
  airtime change tested — a green dev run does not prove MTN airtime.
- The review contact and demo account live in App Store Connect
  (`appStoreReviewDetail`) and Play's **App access** declaration, not in this
  repository. Update both when the demo number or PIN changes.
