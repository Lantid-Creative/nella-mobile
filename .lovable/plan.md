# Nella mobile app: functionality, UI/UX, fixes and launch plan

## Target experience

A genuine mobile-first Nella money companion—not a generic AI chatbot. Customers log in or complete progressive onboarding, then go directly into chat. Keep Nella’s blue identity, Plus Jakarta Sans and friendly mascot. The top-right profile remains the home for account controls; avoid a crowded menu system or permanent dashboard navigation.

**Current position:** the app is a browser-local demonstration. Payment preparation, mobile service sheets and local preview downloads exist. Live login, bank accounts, identity checks, transactions, notifications, real receipts and delivered support are not connected. The original Nella repository contains many of these execution paths, but source inspection does not verify that they are currently operating in production.

## Priority 0 — Safe, working foundation

**Account access:** replace plaintext browser PINs, editable sessions and phone-only demo reset with server-verified authentication and recovery. Verify phone ownership; handle expired codes, resend, existing accounts, lost devices, number changes and revoked sessions. Device biometrics must not substitute for bank authorization.

**Progressive onboarding:** welcome → phone verification → private identity form → private PIN → bank result → chat. Match the applicable source onboarding version: 11-digit NIN/BVN, valid DOB and 18+ check, home address, four-digit PIN and verified/preferred name. Support resume/retry/help and pending/failed/action-required outcomes. Keep identity/PIN data out of chat and analytics. Use approved consent/disclosures; a demo profile is not a bank account.

**Shared Nella services:** connect the approved source service, not copied credentials or a competing ledger. Map WhatsApp and app identities to the same customer and account. Connect balance/funding, name enquiry, fees, bill catalogues, transaction history and support. Enforce ownership, eligibility and financial rules server-side; AI interpretation is never authorization.

**Money safety:** request → missing details → verified recipient/product → fee-inclusive quote → review/edit/cancel → private approval → submit once → actual outcome. Preserve source quote expiry and current minimums, including ₦100 for bank transfers. Prevent duplicates from taps, retries or both channels. Distinguish processing/held/unknown/success/failed/reversed. Recover ambiguous results, refunds and pending tokens; never invite blind retry. Receipt-generation failure cannot undo success.

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

## Mobile delivery and technical decisions

This TanStack app is mobile web, not React Native or an App Store/Play Store package. Preserve the supported stack now; before release choose home-screen web installation or a separately packaged native-wrapper route. Store releases, native push, secure device storage, biometrics and deep links need separate implementation and real-device testing. A resized preview does not prove them.

If installation is chosen, begin with icons/home-screen metadata. Offline caching is separate scope; never add offline financial execution or expose cached personal data as current truth.

Use one authoritative Nella ledger/account service, authenticated channel adapters and durable conversation/notification/support state. Provision Lovable Cloud for new app-owned persistence if needed. Keep financial operations in protected server functions with verified callbacks, least privilege, idempotency and reconciliation. Chat/activity/receipts/push must read the same event state. Test every financial rule, ownership, quote expiry, recovery cooldown and duplicate submission.

## Recommended execution order and acceptance gates

1. **Mobile UX hardening:** keyboard/back/scroll, sheet headers/actions, field preservation, accessibility and profile simplification. Existing demo behavior must keep passing.
2. **Trusted foundation:** phone ownership, real sessions, secure onboarding and shared account identity. Verify signup, resume, login, recovery and logout end-to-end.
3. **Money services:** funding/balance, transfers, airtime/data/bills and private approvals. Verify actual result readback, not only an accepted request.
4. **Operational completion:** activity, confirmed receipts/statements, notifications, support and media. Verify a signed event reaches durable storage and the correct customer screen.
5. **Business/growth and mobile packaging:** eligible services, chosen distribution path, performance and production readiness.

**Release gate:** test iOS Safari/installed mode as applicable and Android Chrome/installed mode on real phones, including 320–430px widths, keyboard open, large text, slow/reconnecting network and foreground/background transitions. Exercise interrupted onboarding, wrong PIN, expired quote, double-tap, insufficient funds, pending/unknown/reversal, missing token, receipt failure, push denial and human support. No duplicate debit, unauthorized access, fabricated success or lost pending-payment state is acceptable.

**Blocking dependencies:** approved service access/credentials, verified channel-to-account mapping, provider test setup, push delivery setup, support operations and approved legal/financial disclosures. Static repository access cannot supply these. No live-money readiness claim until these checks pass.