# Approved mobile plan: implementation status

## Completed in this app
- Payment preparation now takes place entirely in chat, replacing the earlier recipient/detail forms: progressive prompts, editable amounts/recipients/providers/plans, cancellation and in-chat previews. Preview reuse also returns directly to chat. Photo and voice attachments remain honest manual-chat fallbacks until extraction/transcription is connected.
- Guided recipient → payment details → review preparation for all five services, with editable recipients/amounts and no payment submission.
- Searchable, service-filtered preview activity with detail view, download, device sharing or clipboard fallback, and editable-detail reuse. These remain distinct from verified transactions.
- Cancellable delayed replies with synchronous overlap prevention; clear/logout/unmount cannot append a late reply.
- No forced composer focus after a reply or before a service sheet; touch Enter allows multiline input and composition does not send.
- History-aware scrolling/new-message indicator and incremental rendering of older messages.
- Shared mobile service navigation with browser Back support, fixed Back/Close/title, visual-viewport sizing and independently scrolling content.
- Payment drafts survive service changes and sheet closing; help drafts survive closing. Drafts remain in memory for this demo session, not persisted after reload or used as banking authorization.
- More compact profile: duplicate alerts access and unsupported recurring-payment shortcut removed; business/growth grouped separately.
- Stored demo users/messages validated including nested preview data; chat-save failure reported rather than throwing or claiming it saved.
- Refund and PIN/account-recovery intents corrected without replacing the existing detailed-payment parser.
- Larger updated touch targets, composer focus indicator, wrapping for long account/review values and reduced motion for status indicators.

## Verification
- Latest frontend increment: all 24 tests passed; signup → guided transfer preparation → keep → search → detail → download/share fallback → reuse verified through the UI, with no runtime errors. Screens checked at 320×568, 393×844, 852×393 and 1280×1800; close controls stayed within the viewport after resizing.
- All 21 unit/regression tests passed; latest harness result was build OK.
- Browser UI: signup to chat, payment review, preview download/reload, activity, notifications, onboarding requirements and unsent help draft.
- Additional UI checks: draft retention across services and close, browser Back closes the sheet without leaving chat, refund/PIN intents, clear during reply, touch multiline input and focus remaining in a sheet during a reply.
- Screens examined at 320×568, 393×460 reduced-height, 852×393 landscape and 1280×1800. No document horizontal overflow and sheet close controls remained visible.
- Reduced-height browser testing is not proof of actual iOS/Android software-keyboard behavior. No real device, live customer, provider payment or native push was verified.

## Genuine connection blocker
The original repository exposes merchant-scoped partner APIs, not a supported personal-customer login/account adapter. `src/lib/partner-api.ts` binds API keys to businesses; `/api/v1/payment-requests` creates business invoices and `/api/v1/transactions` reads the business statement. A customer's phone on an invoice is not proof of account ownership.

Before this app can replace demo login or use existing Nella accounts, the original Nella project needs an authenticated customer channel adapter with verified phone ownership, customer-scoped sessions and authorized account/ledger/transaction operations. Source snapshots are read-only, so this chat cannot implement that adapter in the other project. Do not copy its credentials, create a competing ledger, or present a new app login as access to an existing banking account.

After the adapter is available: connect resumable secure onboarding, account/balance/funding, provider catalogues/quotes/private authorization, durable execution/status/reconciliation, real receipt PNG/PDF, notifications/push, human support and eligible business flows. Approved privacy/disclosures, provider test access and support operations remain dependencies.

Native packaging/home-screen installation is a separate delivery decision; no installation, offline execution, biometrics or app-store readiness is claimed.