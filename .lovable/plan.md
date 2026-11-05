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

## Priority 1 — Complete the essential customer journeys

| Area | Required app experience |
|---|---|
| Funding and balance | Real account holder/bank/number, copy/share details, balance visibility control, incoming-credit updates; never generate a fake funding destination. |
| Transfers | Bank and registered Nella phone-number transfers, verified recipient, optional narration, fee-inclusive quote, balance checks, edit/cancel, private authorization and result. |
| Airtime | Self/other number, network selection, amount, quote, authorization and fulfilment. |
| Data | Live network bundle list with price, allowance and validity; no assumption that free-form amount identifies a valid bundle. |
| Electricity/cable | Supported biller, meter/smartcard, customer validation, prepaid/postpaid or actual package, amount, token/units when supplied and token-pending follow-up. |
| Beneficiaries | Verified save, alias search, rename/tag/delete, collision handling and saved bill numbers; optional save after successful payment. |
| Activity | Search/filter, real dates and statuses, full transaction detail, charges, reference, timeline, receipt retrieval and transaction-linked help. Clearing chat must not delete financial records. |
| Receipts/statements | Branded confirmed PNG receipts, download/share, historical reference lookup, PDF statements; mark previews separately. Source statement default is 90 days with 1–365-day support. |
| Notifications | Durable inbox, unread state, event-to-transaction links, in-chat updates, device push consent and delivery; no sensitive lock-screen content by default. |
| Support/disputes | Submit category/reference/details, see replies and case state, human takeover, return to Nella, link disputed transaction. Complaints do not automatically reverse money. |
| Security/recovery | Private PIN setup/change/reset, lock/cooldown handling, device/session management, verified number change, account protection and human escalation. Source recovery’s transfer pause must remain visible and enforced. |
| Insights | Real spending/income summaries and statement periods; no invented spending figures, advice or savings product. |
| Voice/photos | Permission, review, upload progress, transcription or extracted details, correction, removal and failure recovery; payment approval always remains mandatory. |

### Notification events to cover
- Account verification/opening and action-required updates.
- Confirmed money received; transfer/purchase result, reversal/refund, receipt ready and electricity token ready.
- Support replies, security events and approved account-move requests.
- Eligible business invoice/payment/approval events.
- Separate essential account alerts from optional reminders/promotions. Preserve source onboarding pause/opt-out rules and quiet hours where applicable; WhatsApp’s messaging-window restriction is not the app’s push-delivery rule.

## Priority 1 — Mobile UI and UX fixes

### Chat and navigation
- Keep the composer reachable above the keyboard; respect notches, home indicators, font scaling and Android back behavior.
- Stop forcing focus or scrolling after every reply. Scroll to new messages only when the customer is already near the bottom; otherwise show a new-message indicator.
- Persist in-progress conversation and payment steps safely. Recover after refresh, lock/unlock, backgrounding and reconnecting.
- Make suggestions context-aware: new-account completion, returning conversation, pending payment and first funding should not look identical.
- Keep Nella warm but restrained: mascot greetings and short status motion, reduced-motion support, no animation distracting from approvals.
- Consolidate duplicated access points and shorten the profile list. Surface only relevant personal/business tools; keep unsupported features out of everyday payment choices.

### Service sheets and forms
- Give every multi-step sheet a visible title, consistent back/close controls and a stable primary action. Avoid overlapping sheets and controls.
- Keep the amount/recipient visible during review; lengthy receipt details must not hide the decision or close control.
- Use searchable banks/billers, actual plan selectors, self/other choices and clear inline errors—not long static dropdowns or free-text product guesses.
- Preserve fields when going back; confirm dismissal only when work would be lost. Distinguish canceling a draft from reversing a submitted transaction.
- Replace repeated technical “not connected” explanations with concise availability states while preserving honest demo labeling.
- Use familiar icons with accessible names, comfortable touch targets (at least 44 CSS pixels), clear contrast and non-color status cues.
- Test screen readers, external keyboards, focus return, enlarged text and long names/references. Mask balances and sensitive values consistently.

## Priority 2 — Performance, resilience and maintainability
- Split large chat/service files into focused, testable features without changing the existing payment behavior accidentally.
- Load older conversations incrementally; paginate lists and avoid mounting every message forever.
- Cancel stale reply work, prevent simultaneous operations and recover controls from failures. Handle storage unavailable/full rather than silently losing state.
- Compress/resize images, bound audio duration/upload size, support cancellation, release media resources and preserve attachment availability through secure storage.
- Cache public catalogues appropriately, but never present cached balance or status as current. Clear personal caches on logout and account switching.
- Design for slow Nigerian mobile networks, short disconnects and app lifecycle changes. Never automatically replay an offline money instruction.
- Instrument startup, chat latency, quote/approval errors, provider failures and crash reports without collecting PINs, identity numbers or sensitive message content.
- Suggested validation targets, to agree before implementation: usable first screen within three seconds on representative mid-range hardware/4G; visible tap feedback within 100 ms; prompt acknowledgement within one second even when processing takes longer.

## Priority 2 — Business and growth, without overwhelming personal chat
- Add business access only for eligible customers, with personal/business switching and source-equivalent role restrictions.
- Sequence KYB/account activation → invoices and payment requests → collection history/reminders → withdrawals and owner-approved bulk/payroll with per-line results.
- Keep full merchant catalogue/POS, stock/orders, customer records, delivery/coupons/events, plan usage and partner integration administration in dedicated business experiences where needed—not the normal personal onboarding.
- Add real referral codes and ambassador intake only after eligibility, attribution and rewards activation are confirmed. Do not promise reward rates.
- Do not advertise personal recurring transfers, card funding, automatic subscription charging, broadcast dispatch, storefront checkout, ticket sales, savings, crypto or cross-border payments as implemented; the audited source does not establish them as completed services.

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