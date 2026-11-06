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

- Keep existing demo-account and banking behavior during presentation refinements; UI completion must not imply verified live banking.
- Keep chat in a fixed visual-viewport shell that tracks height and offset, locks document scrolling only while mounted, and scrolls only the conversation; this prevents mobile keyboard panning from displacing the composer.
- Compose welcome and chat identity from the shared Nella mascot component, and use design-system buttons for all updated controls.
- Keep new-customer setup inside the public entry page with progressive steps, then navigate directly to chat; this preserves the minimal navigation model.
- Collect payment details through the shared conversational payment state machine and chat composer, never payment-entry sheets; preserve the existing complete-message parser and keep previews distinct from verified transactions. Non-payment account views remain shared sheets.
- Do not collect identity documents or banking PINs in the browser demo; enable secure account verification and provider-backed authorization before accepting sensitive live-account inputs.
- Keep conversational payment drafts scoped to the active demo account in memory, never persist private approval inputs; use shared sheet history for non-payment views and cancellable reply work to preserve mobile navigation and focus.
- Validate browser-preview storage on read and surface failed writes; browser state is never live-account authorization.
- Keep prepared-payment search and draft reuse in the shared workspace; reuse only editable details, never approval or provider execution identifiers. Unsubmitted breakdowns have no download or share actions.
- Extract natural payment details through the shared request parser before prompting, using the active account phone for self-purchases; never infer a network or confuse recipient/plan numbers with money.
- Keep approval PIN input in an ephemeral private dialog bound to the current chat draft; local demo PIN checks never authorize payments or create transaction receipts.
- `/` is the branded splash that routes to `/auth` or `/chat`; sign-out and entry links point at `/auth`, never back to the splash.
- Biometric unlock uses the WebAuthn platform authenticator via the shared biometrics module and covers whatever the device offers (fingerprint, face, iris, pattern) — wording always says "biometrics"/"device unlock", never fingerprint only; it only opens the demo session on this device, never replaces the payment PIN, and always keeps PIN login as the fallback.

- Gate splash, login, biometric entry and chat through both demo onboarding and KYC-setup completion; incomplete or legacy accounts resume progressive KYC at /auth so navigation cannot skip it. Use sample identity/address details until secure provider verification is connected, never label demo completion as verified KYC.
- Store only validated pre-account profile setup drafts and account-scoped KYC step checkpoints; never persist setup confirmation PINs or acknowledgments.
- Own recording lifecycle in the shared voice-note hook; cancel pending microphone requests and active recordings on background/unmount, and transfer only reviewed audio URLs to session chat.
- Attach breakdown edits only to the latest active review and route them through the conversational state machine; reuse prepared details with a fresh review, never approval state.
