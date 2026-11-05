# Nella mobile app: functionality, UI/UX, fixes and launch plan

## Target experience

A genuine mobile-first Nella money companion—not a generic AI chatbot. Customers log in or complete progressive onboarding, then go directly into chat. Keep Nella’s blue identity, Plus Jakarta Sans and friendly mascot. The top-right profile remains the home for account controls; avoid a crowded menu system or permanent dashboard navigation.

**Current position:** the app is a browser-local demonstration. Payment preparation, mobile service sheets and local preview downloads exist. Live login, bank accounts, identity checks, transactions, notifications, real receipts and delivered support are not connected. The original Nella repository contains many of these execution paths, but source inspection does not verify that they are currently operating in production.

## Priority 0 — Make the foundation safe and functional

### 1. Real account access and secure onboarding
- Replace browser-only accounts and recoverable local PIN storage with authenticated accounts and protected sessions. The current demo reset must never become real account recovery.
- Verify ownership of the customer’s Nigerian phone number. Handle incorrect/expired codes, resend, existing accounts, changed numbers, lost devices and session expiry.
- Separate app access from payment authorization. Offer device biometrics only as a supported convenience, with secure fallback; never treat a browser check as bank authorization.
- Keep onboarding progressive: welcome → phone verification → identity details → private PIN → bank verification outcome → chat. Support save/resume, retry and help without starting over.
- Match the source’s applicable onboarding version: NIN and BVN (11 digits), real date of birth and 18+ check, home address, private four-digit PIN, verified/preferred name handling. Keep sensitive inputs out of chat and analytics.
- Show pending, failed, action-required and completed verification distinctly. A demo profile is not an opened bank account.
- Add consent, privacy/terms links and account-opening disclosures using approved business wording—not invented licences or assurances.

### 2. Connect the approved Nella money services
- Establish a supported, authenticated connection to the original Nella service rather than copying credentials or duplicating its ledger.
- Resolve how WhatsApp and app identities map to the same customer. Both channels must see the same balance, transaction, support and account status.
- Connect account details, verified balance, funding alerts, bank lookup, recipient-name enquiry, fees, bill catalogues and transaction history.
- Enforce account ownership, eligibility, roles and financial rules on the server. An AI interpretation or editable phone number must never grant access.
- Keep demo and real environments clearly separated; test with approved test accounts before controlled real-account checks.

### 3. Safe money movement and accurate status
- Complete the flow: request → missing details → verified recipient/product → amount and fees → review/edit/cancel → private approval → submission → final result.
- Display recipient name, destination, amount, each charge and total debit before authorization. Preserve the source’s quote-expiry behavior; refresh an expired quote rather than silently reusing it.
- Prevent duplicate execution from double-taps, network retries, app reopening, or requests arriving from both channels.
- Represent processing, held, unknown, successful, failed and reversed states separately. Never turn a timeout into a success or invite another payment while the first is uncertain.
- Preserve reconciliation, bill-refund handling and electricity token-pending recovery. Receipt-rendering failure must not change a successful payment into a failed one.
- Match the source’s current applicable rules, including the ₦100 bank-transfer minimum, rather than old marketing or tier-limit copy.

## Priority 1 — Complete customer functionality

| Area | Required mobile experience |
|---|---|
| Funding/balance | Verified account details, copy/share, balance privacy, confirmed credit updates. |
| Transfers | Bank and Nella phone transfers; verified name, fees, narration, edit/cancel, private authorization, final result. |
| Airtime/data | Self/other number, network, live bundles with price/allowance/validity, approved purchase. |
| Electricity/cable | Live biller/product, meter/smartcard and customer validation, prepaid/postpaid, confirmed result, token/units and token-pending recovery. |
| Beneficiaries | Verified save, aliases/search, rename/tag/delete, saved bill numbers. |
| Activity/receipts | Search/filter, dates, charges, status timeline, reference lookup, branded confirmed PNG download/share; previews remain separate. |
| Statements/insights | Ledger-backed income/spending and PDF statements; source default 90 days, supported range 1–365. |
| Notifications | Durable inbox, unread state, transaction links, device permission, push delivery; privacy on lock screen. |
| Support/disputes | Send category/reference/details, replies/case state, human takeover, return to bot; no automatic reversal. |
| Recovery/security | Private PIN forms, verified recovery, lock/cooldown visibility, device sessions, number change and account protection. |
| Voice/photos | Permission, bounded upload, review, transcription/extraction, correction and retry; mandatory payment approval. |

Cover account-opening events, incoming credits, payment outcomes, reversals/refunds, receipts/tokens, support replies, security and eligible business approvals/invoice reminders. Separate essential alerts from optional reminders/promotions; preserve source opt-outs/quiet hours. WhatsApp’s messaging-window rule is not an app push rule.

## Priority 1 — Concrete fixes found in the current app

These are source findings; keyboard/overflow risks still require device testing. Details: `docs/mobile-readiness-fixes.md`.

1. Cancel delayed replies on clear/logout/unmount; do not automatically focus the composer after every reply or underneath a sheet.
2. Stop scrolling customers away from older messages. Follow the bottom only when appropriate; otherwise show a new-message indicator.
3. Preserve payment/support drafts when changing sheets; add consistent parent navigation and handle Android/browser Back before leaving chat.
4. Size sheets to the keyboard-visible space; keep title, Back, Close and primary actions reachable. Separate fixed navigation from scrolling details.
5. Validate stored data and handle blocked/full storage; malformed valid JSON must not crash startup or silently lose saved state.
6. Correct chat intent routing: “refund” currently matches funding; “forgot PIN”/“recover account” miss security. Cover these with regression tests.
7. Wrap long names/references/amounts and bound input lengths. Test 200% text, small screens and long unbroken values.
8. Preserve input-method composition, visible focus, multiline entry, 44px touch targets and reduced motion for all status animations.
9. Shorten the profile list and consolidate duplicate access points; show only relevant personal/business tools.
10. Replace static providers/free-text plans with real searchable catalogues once connected. Use concise unavailable states rather than repetitive technical explanations.

## Mobile design rules

- Composer above keyboard; safe areas, notches and home indicators respected.
- Stable titles/back/close/actions, no overlapping sheets or unexpected discarded work.
- Clear pending/error/empty/offline states with a useful next action.
- Verified recipient, amount, fees and total always visible before authorization.
- Context-aware greeting/actions for new accounts, pending setup, returning conversations and unfinished payments.
- Nella mascot remains warm and restrained, never distracting from approval.
- Screen-reader labels, contrast, non-color status cues, focus return and enlarged text must work.
- Clearing chat must not remove financial records; unknown payments must survive reopening.

## Priority 2 — Optimize performance and resilience

- Split large chat/service modules; paginate history and lists instead of rendering unlimited messages.
- Cancel stale work, recover controls after failures, safely retain progress across reconnect/background/foreground.
- Compress images, bound recording/upload size, cancel uploads, release resources, store media securely.
- Cache public catalogues, not stale financial truth; clear personal caches on logout/account switching.
- Never replay a money instruction automatically when reconnecting.
- Measure startup, reply/quote latency, errors, crashes and provider outcomes without logging secrets or sensitive messages.
- Proposed test targets—not current measurements: usable first screen within three seconds on representative mid-range hardware/4G, tap feedback within 100ms, request acknowledgement within one second.

## Priority 2 — Business and growth

Sequence eligible business account/KYB → invoices/payment requests/collections → reminders → withdrawals and owner-approved bulk/payroll with per-line outcomes and roles. Keep full merchant POS/stock/orders, customers, delivery/coupons/events, plans and partner administration in dedicated business experiences rather than ordinary personal chat.

Referrals/ambassadors require actual eligibility, attribution and rewards activation. Do not promise reward amounts. Do not advertise personal recurring transfers, card funding, automated subscription charging/broadcasts, complete storefront checkout, ticket sales, savings, crypto or cross-border payments as delivered; the source does not establish these as completed services.

## Mobile delivery decision

The current TanStack app is mobile web, not React Native and not an App Store/Play Store package. Keep this supported stack for the current work. Before release, choose between home-screen web installation and a separately packaged native-wrapper route. Store distribution, native push, secure device storage, biometrics, deep links and release signing require their own implementation and real-device verification; a resized browser preview does not prove them.

Do not add offline financial execution. If installability is chosen, start with app icons/home-screen metadata; offline caching is a separate scope and must never expose another account’s data or stale financial truth.

## Technical implementation details

- Use the existing TanStack route structure and design-system controls. Keep secure account/payment operations server-owned and chat-triggered presentations separate from financial execution.
- Choose a single authoritative Nella ledger and account service. Implement authenticated channel adapters and persistent conversations, notifications and support linkage; provision Lovable Cloud where new app-owned persistence is needed.
- Use protected server functions, verified provider callbacks, least-privilege access, idempotency and durable reconciliation/recovery. Reuse the source’s financial contracts—not unverified deployment configuration.
- Define notification and transaction models once; update chat, activity, receipts and push from the same events.
- Keep customer-facing financial rules covered by concrete tests, including approval expiry, minimums, recovery cooldown, ownership and duplicate submission.

## Recommended execution order and acceptance gates

1. **Mobile UX hardening:** keyboard/back/scroll, sheet headers/actions, field preservation, accessibility and profile simplification. Existing demo behavior must keep passing.
2. **Trusted foundation:** phone ownership, real sessions, secure onboarding and shared account identity. Verify signup, resume, login, recovery and logout end-to-end.
3. **Money services:** funding/balance, transfers, airtime/data/bills and private approvals. Verify actual result readback, not only an accepted request.
4. **Operational completion:** activity, confirmed receipts/statements, notifications, support and media. Verify a signed event reaches durable storage and the correct customer screen.
5. **Business/growth and mobile packaging:** eligible services, chosen distribution path, performance and production readiness.

**Release gate:** test iOS Safari/installed mode as applicable and Android Chrome/installed mode on real phones, including 320–430px widths, keyboard open, large text, slow/reconnecting network and foreground/background transitions. Exercise interrupted onboarding, wrong PIN, expired quote, double-tap, insufficient funds, pending/unknown/reversal, missing token, receipt failure, push denial and human support. No duplicate debit, unauthorized access, fabricated success or lost pending-payment state is acceptable.

**Blocking dependencies:** approved service access/credentials, verified channel-to-account mapping, provider test setup, push delivery setup, support operations and approved legal/financial disclosures. Static repository access cannot supply these. No live-money readiness claim until these checks pass.