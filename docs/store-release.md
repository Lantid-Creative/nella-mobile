# Store submission

Everything needed to get Nella onto the **App Store** and **Google Play**, and
what is already automated so the release is a terminal command rather than a
click-through.

The app today is a **preview**: the account, the chat and the payment breakdowns
live on the device, no bank is connected and no money moves. That is deliberate
and it is stated in the app, the listing and the privacy policy. The work that
has to happen before real money is handled is in [§7](#7-before-real-money).

---

## 0. Fill in `store.config.json` first

Both stores reject a listing whose support or privacy URL is dead, so the
pipeline refuses to run while this file still holds the placeholder:

```json
{
  "siteUrl": "https://nella.example",
  "supportEmail": "support@nella.example",
  "copyright": "2026 Lantid Creative",
  "appVersion": "1.0.0"
}
```

Set `siteUrl` to the public address of the **deployed web app** (publish it from
Lovable, or host the `bun run build` output anywhere), and `supportEmail` to a
mailbox you actually read. The app already serves the pages the listing points
at:

| Path       | Used as                                       |
| ---------- | --------------------------------------------- |
| `/support` | App Store support URL                         |
| `/privacy` | Privacy policy URL (mandatory in both stores) |
| `/terms`   | Terms, linked from the policy                 |
| `/`        | Marketing URL                                 |

Then commit:

```sh
git add store.config.json && git commit -m "Point the store listing at the live site"
git push
```

Everything downstream — the App Store URL fields, the copyright line, the
marketing version — is read from this file. Never edit the URLs anywhere else.

---

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
| Privacy manifest           | `ios/App/App/PrivacyInfo.xcprivacy` — no tracking, no collected data                                              |
| Export compliance          | `ITSAppUsesNonExemptEncryption = false` in `Info.plist`                                                           |
| Camera / microphone        | usage strings on iOS, permissions on Android                                                                      |
| Upload uploads             | `fastlane/Fastfile` lanes for both stores, called by `.github/workflows/store.yml`                                |

The build machine here has no Xcode, no Java and no Android SDK, so **the native
builds run on GitHub Actions**. That is not a workaround — it is also how the
release should be made, because it keeps one signing identity in one place.

---

## 2. The two one-time browser steps

The store APIs cannot create an app record or accept a legal agreement. These
have to be done once, by you, in a browser. Nothing else needs a browser.

### App Store Connect

1. <https://developer.apple.com/programs/> — enrol ($99/year) if you have not.
2. <https://appstoreconnect.apple.com> → **My Apps → + → New App**
   - Platform **iOS**, name **Nella**, primary language **English (U.S.)**
   - Bundle ID **`creative.lantid.nella`** — if it is not in the list, register
     it first at <https://developer.apple.com/account/resources/identifiers>
   - SKU: anything stable, e.g. `nella-ios`
3. **Agreements, Tax, and Banking** → accept the _Paid Applications_ agreement
   if you plan to charge later. A free app still needs the free agreement
   accepted, or the build cannot be submitted.
4. **Users and Access → Integrations → Team Keys → +** — App Manager role.
   Copy the key ID and issuer ID, and download the `.p8` (only downloadable
   once).

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

- **Content rating** → answer the questionnaire. The preview has no user
  content, no ads, no purchases → expect _Everyone_.
- **Data safety** → **No data collected**, **no data shared**, no tracking. This
  matches the iOS privacy manifest.
- **App access** → _All functionality is available without special access_.
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

> Nella is a chat-first money companion. This build is a preview: it is a native
> WebView shell around an offline-first web app, with native camera capture,
> microphone recording, haptics, the Android hardware back button and WebAuthn
> device unlock. No bank account is connected, no payment can be completed and no
> data leaves the device. Tap "Get started" — there is no account to create and
> no credentials are needed.

### Screenshots

`bun run screenshots` regenerates all of them from the running app:

- 6.9" iPhone — 1320×2868
- 6.5" iPhone — 1242×2688
- Android phone — 1080×1920
- Play feature graphic 1024×500, icon 512×512

It drives the real UI: the welcome screen, the chat, a transfer being prepared,
and the review card. If the UI changes, re-run it — never ship screenshots of a
build that no longer exists.

---

## 6. If a run fails

| Symptom                                                   | Cause                                                                                                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `store.config.json still holds the placeholder siteUrl`   | Fill in §0.                                                                                                |
| iOS: `No profiles for 'creative.lantid.nella' were found` | `APPLE_TEAM_ID` is wrong or the App ID is not registered.                                                  |
| iOS: authentication error                                 | The `.p8` in `APP_STORE_CONNECT_KEY_CONTENT` must be the raw file contents, and the key needs App Manager. |
| Android: `Version code 1 has already been used`           | Bump: `./gradlew bundleRelease -PversionCode=2`.                                                           |
| Android: `Package not found`                              | The app record does not exist yet, or the service account was not granted access to it.                    |
| Play rejects the listing                                  | The content rating or data safety declaration is still empty.                                              |

---

## 7. Before real money

The preview is honest about what it is, and that honesty has to survive the
connection to live services.

- [ ] **A real customer session API.** The old `/api/mobile/*` routes were
      retired on 10 Nov 2026: they took the phone and PIN in the query string on
      a session token that never expired. The replacement needs a short-lived,
      revocable session carried in the `Authorization` header. Do not resurrect
      the old scheme.
- [ ] **Server-owned financial rules.** Quote expiry, fees, limits and
      eligibility are decided on the server. The app may preview and request —
      never authorise.
- [ ] **Idempotency.** A transfer is submitted once with an idempotency key, and
      the outcome distinguishes processing / held / unknown / failed / sent /
      reversed. `unknown` must never invite a blind retry.
- [ ] **Private approval.** The PIN goes into a private form and is verified by
      the server — never in chat, never compared in the browser.
- [ ] **Durable events.** Balance, activity, receipts, notifications and support
      read the same event state, so the app and WhatsApp never disagree.
- [ ] **Push notifications.** `@capacitor/push-notifications`, APNs, FCM and a
      device-token registry on the server.
- [ ] **Secure storage.** Move the session out of `localStorage` into the iOS
      keychain / Android encrypted storage.
- [ ] **Update the privacy manifest and both store privacy labels** for the data
      that is now collected. This is a legal change, not a code change.
- [ ] **Update `docs/whatsapp-to-app-coverage.md`**, the coverage audit and
      handoff for this work.

---

## 8. Known gaps in this release

- The app talks to no backend; everything is local.
- No push notifications, no offline caching and no deep links.
- Play's content rating and data safety are console-only, so the first Android
  release lands as a draft.
- The privacy manifest, both privacy labels and the policy text all have to be
  updated together when live banking arrives.
