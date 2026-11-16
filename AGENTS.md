<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Repository shape

- The TanStack Start web app lives at the repository ROOT (`src/`, `public/`, `vite.config.ts`, `package.json`). The former `web/` folder and the React Native / Expo app that used to sit beside it are gone — do not reintroduce React Native, Expo, `app.json`, `eas.json` or `babel.config.js`.
- `ios/` and `android/` are generated Capacitor native projects that wrap the built web app for the App Store and Play Store. Regenerate them with `npm run cap:sync`; never hand-edit generated Capacitor plumbing (edit `capacitor.config.ts` and re-sync instead).
- `dist/` is the Capacitor `webDir` — the static SPA build. It is generated; never commit it.
- Brand imagery must be a real file under `src/assets/` so it is bundled. A remote `/__l5e/assets-v1/...` pointer only resolves on a Lovable preview host and will 404 in the store app.
- `npm run build` stays the SSR/Cloudflare build. `npm run build:app` is the prerendered SPA build the native shell loads. Both must stay green.

## Product honesty

- Keep existing demo-account and banking behavior during presentation refinements; UI completion must not imply verified live banking.
- Do not collect identity documents or banking PINs in the browser demo; enable secure account verification and provider-backed authorization before accepting sensitive live-account inputs.
- Validate browser-preview storage on read and surface failed writes; browser state is never live-account authorization.
- Keep approval PIN input in an ephemeral private dialog bound to the current chat draft; local demo PIN checks never authorize payments or create transaction receipts.
- Biometric unlock uses the WebAuthn platform authenticator via the shared biometrics module and covers whatever the device offers (fingerprint, face, iris, pattern) — wording always says "biometrics"/"device unlock", never fingerprint only; it only opens the demo session on this device, never replaces the payment PIN, and always keeps PIN login as the fallback.

## Chat, payment and navigation

- Keep chat in a fixed visual-viewport shell that tracks height and offset, locks document scrolling only while mounted, and scrolls only the conversation; this prevents mobile keyboard panning from displacing the composer.
- Compose welcome and chat identity from the shared Nella mascot component, and use design-system buttons for all updated controls.
- Keep new-customer setup inside the public entry page with progressive steps, then navigate directly to chat; this preserves the minimal navigation model.
- Collect payment details through the shared conversational payment state machine and chat composer, never payment-entry sheets; preserve the existing complete-message parser and keep previews distinct from verified transactions. Non-payment account views remain shared sheets.
- Keep conversational payment drafts scoped to the active demo account in memory, never persist private approval inputs; use shared sheet history for non-payment views and cancellable reply work to preserve mobile navigation and focus.
- Keep prepared-payment search and draft reuse in the shared workspace; reuse only editable details, never approval or provider execution identifiers. Unsubmitted breakdowns have no download or share actions.
- Extract natural payment details through the shared request parser before prompting, using the active account phone for self-purchases; never infer a network or confuse recipient/plan numbers with money.
- `/` is the branded splash that routes to `/auth` or `/chat`; sign-out and entry links point at `/auth`, never back to the splash.

## Onboarding, KYC, media and theme

- Gate splash, login, biometric entry and chat through both demo onboarding and KYC-setup completion; incomplete or legacy accounts resume progressive KYC at /auth so navigation cannot skip it. Use sample identity/address details until secure provider verification is connected, never label demo completion as verified KYC.
- Store only validated pre-account profile setup drafts and account-scoped KYC step checkpoints; never persist setup confirmation PINs or acknowledgments.
- Own recording lifecycle in the shared voice-note hook; cancel pending microphone requests and active recordings on background/unmount, and transfer only reviewed audio URLs to session chat.
- Attach breakdown edits only to the latest active review and route them through the conversational state machine; reuse prepared details with a fresh review, never approval state.
- Theme (light/dark/phone setting) lives in the shared theme module, applied by a head boot script plus root sync; colors switch only through the .dark tokens so every screen follows it.
- Keep profile expansion gestures on a fixed handle with pointer capture and independent content scrolling; canceled gestures must never activate actions.

## Store release

- `bundle id` / `application id` is `creative.lantid.nella` on both platforms; never change it after the first store submission.
- The release checklist — store accounts, certificates, CI secrets, listing metadata and submission steps — lives in `docs/store-release.md`. Keep it accurate as the native projects change.
- The app must build offline of Lovable: no runtime dependency on `*.lovable.app`, the Lovable preview proxy, or any `/__l5e/...` path.
