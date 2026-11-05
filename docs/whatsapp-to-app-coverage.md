# Nella WhatsApp → mobile app coverage

Source: read-only original Nella repository `0d7d3ca7-2bcd-424c-a324-04bde72c69e0`, snapshot dbcb92a1, reviewed 5 November 2026.

## Delivery boundary

This app remains a browser-local demo with no connected account service. The source repository contains execution paths, but its current hosting, database records, provider credentials and production operation were not verified or imported. Screens are provisions, not a replacement banking integration. Never import private credentials from the source snapshot. No identity numbers, banking PIN, fake bank account, successful transaction, live notification or referral reward are generated here.

## Customer provisions now present

| Original function | Mobile entry / experience | Integration required |
|---|---|---|
| Login and new customer setup | Progressive public entry, directly into chat; existing demo login/reset retained | Real sessions, phone verification, device management |
| Secure identity onboarding | Profile → Complete account setup; completed demo profile vs pending bank verification, NIN/BVN/DOB/address/private PIN requirements | Private server-backed form, NIN-derived name, bank opening, resumable state, rollout gate |
| Own account and funding | Profile → Account & funding; unavailable balance, no account number issued | Verified account, ledger balance, inflow webhook reconciliation |
| Transfers | Chat quick action → bank, account, amount, optional narration → review/edit → keep/download marked preview | Bank catalogue, name enquiry, fees, sufficient funds, PIN approval, idempotent execution |
| Airtime / data | Chat or money services → network, phone, amount and plan → review | Live provider networks and data bundle catalogue; self/other selection |
| Electricity / cable | Pay a bill → biller, meter/smartcard, prepaid/postpaid or package, amount → review | Actual biller/products catalogue, customer validation, fee quote, fulfilment, electricity token |
| Activity / receipts | Profile or chat; verified empty state separated from locally saved payment previews | Read real transaction history, reference lookup and provider-confirmed PNG receipts |
| Notifications | Header bell / profile; empty inbox and account-event categories | Durable event inbox, session-scoped reads, realtime, push registration and delivery |
| Beneficiaries | Profile or chat; verified empty state and recipient entry | Resolve/save/rename/tag/delete aliases, saved bill numbers |
| Security / recovery | Profile; distinct change PIN, forgot PIN, freeze and recover availability states | Private authenticated forms, identity recovery, lock clearing and source 24-hour transfer cooldown |
| Support / disputes | Profile or chat; category, optional reference, description, explicitly unsent draft | Support thread submission, human takeover, replies, linked transaction, high-priority dispute; no automatic reversal |
| Insights / statements | Profile or chat; empty spending state, statement-period choice, disabled real export | Ledger analysis and PDF statement export (source default 90 days, allowed 1–365) |
| Business | Profile or chat; service inventory and account-help entry | KYB and active business account, roles, invoices, collections, reminders, bulk owner approval |
| Referrals / ambassadors | Profile or chat; no fabricated code/reward, enquiry entry | Referral attribution, qualifying transaction, reward activation, ambassador intake |
| Voice / image instructions | Existing recording and photo review remain; honest no-transcription/no-extraction reply | Upload/storage, transcription/OCR/AI; extracted details must still be reviewed and authorized |
| Personal recurring payments | Existing profile entry now explicitly says unsupported | Source rejects recurring personal transfers; do not substitute a one-time send |

## Payment and receipt state contract for connection

1. Resolve recipient/biller and source account; show verified name, service, destination, amount, individual charges and total debit.
2. Quote is editable/cancellable and expires after the source's three-minute approval window. Request PIN only in a private authenticated form, never chat.
3. Submit once with an idempotency key. Retain `processing`, `held`, `unknown`, `failed`, `sent` and `reversed` outcomes. `unknown` is not a failure and must not invite blind retry. Recover through provider reconciliation.
4. Show confirmation before rendering a receipt. Rendering failure must not erase successful payment. Receipts include status, amount, date, sender, recipient, bank/account or bill/customer ID, optional narration, reference and session ID. Electricity additionally carries token/units when supplied; token-pending is separate from failed.
5. Activity supports details, reference lookup, receipt download/share, status history and contact support. Current downloadable text files are unmistakably previews, not the source's final PNG receipts.
6. Transfer preview minimum matches source ₦100; variable electricity preview minimum is ₦100. Production limits, fees, eligibility and provider validation must be server-owned, not inferred from browser state.

## Notifications to connect

- Account opening success, resumable/pending verification, account move approval and security/recovery events.
- Verified incoming credit and balance update; pending result resolution, reversal and fee-refund result.
- Transfer/purchase confirmation and receipt-ready; electricity token-ready/pending.
- Support takeover/reply/resolution and dispute updates.
- Business KYB decision/activation, sign-in code, payout/bulk owner approval, per-line results, invoice delivered/paid/due/overdue.
- Onboarding reminders are gated in source: at most two nudges, 1–3 and 20–23 hours, Lagos quiet hours 21:00–07:00, pause/stop/support exclusions. App push must be separately consented and need not inherit WhatsApp's 24-hour messaging window.

## Remaining source functions requiring dedicated integration work

- Internal Nella phone-number transfers, send-entire-balance, beneficiary name lookup and alias maintenance.
- Resume/restart onboarding, preferred name fallback, duplicate-identity/account move approvals, KYC correction/document upload.
- Private PIN setup/change/recovery, existing-owner account move approval, verified lost-device freeze/recovery (source public freeze pages are placeholders, not a working contract).
- Business KYB (RC/BN, registration/TIN/address, corporate/director identity), account switching and Owner/Manager/Accountant/Cashier access; six-digit code/password sessions and revoke-all.
- Business catalogue, stock/POS, order progression/cancel, invoices create/list/send/mark-paid (manual payment status is not verified settlement), customers, withdrawals and bulk/payroll with up to 200 validated lines and owner private approval.
- Merchant records: delivery zones, coupons, events, subscription status, broadcast drafts/segments, assistant settings, storefront/domain status, paid plans/usage, partner keys, payment requests and signed webhook delivery/replay. These are not all WhatsApp chat commands; avoid forcing merchant administration into ordinary personal onboarding.
- Source does not establish connected card funding, personal recurring payments, automated subscription charging/broadcast dispatch, complete storefront checkout or ticket sale/check-in. Savings, crypto and cross-border claims must not be invented.

## Source evidence

- `src/routes/api.whatsapp.webhook.ts`: command routing, payment conversations, support/history/statement/receipt requests, media, recurring guard.
- `src/lib/onboard.ts`, `onboarding-v2.ts`, `flows.ts`, `flows/nella_onboarding_v2.json`: account opening/identity/private forms and rollout.
- `src/lib/transfers.ts`, `banks.ts`, `guard.ts`, `bills.ts`: quotes, recipient verification, execution, uncertain states, bill catalogue/refunds.
- `src/routes/api.vbaas.webhook.ts`, `src/lib/ops.ts`: inflows, final outcome/reversal/recovery and reminder jobs.
- `src/lib/documents.ts`, `docimages.ts`, `nella-documents/receipt-transfer.html`, `receipt-bill.html`, `statement.html`: document fields and actual PNG/PDF generation.
- `src/lib/recovery.ts`, `cooldown.ts`, `account-moves.ts`, `support-triage.ts`: recovery, account move and human-support lifecycle.
- `src/lib/business.ts`, `business-admin.ts`, `business-money.ts`, `business-payouts.ts`, `mbiz-session.ts`, `src/routes/api.merchant.call.ts`: business coverage and permissions.
- `src/lib/referrals.ts`, `ambassadors.ts`, `partner-api.ts`, `partner-webhooks.ts`: growth and partner integrations.

## Verification and blockers

Browser demo flow verified: signup → chat → transfer details → review → preview download → persisted chat reload → activity → notifications → setup requirements → support draft. Mobile widths 320 and 393, desktop 1280, no horizontal overflow. Unit tests cover existing demo behavior, presentation routing, account-number validation, source transfer minimum and prevention of fabricated receipt identifiers.

**Not verified:** any authenticated live account, provider execution, real identity verification, incoming credit, push, receipt PNG/PDF or delivered support reply. These require connecting this app to the approved Nella services with credentials, durable data, server authorization and tested provider events. The exhaustive audit above is the handoff for that separate integration stage, not a claim that all merchant functionality is implemented here.