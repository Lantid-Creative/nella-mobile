# Nella WhatsApp → mobile app coverage

Audited against the live Nella service (`src/routes/api.mobile.v1.*` in the
`nella` repository) on 23 November 2026.

## Delivery boundary

The app is no longer a browser demo. It is a signed-in client of the Nella
mobile API at `https://usenella.com/api/mobile/v1`, which runs the same PIN-gated
engine — and the same VFD wallet and bills catalogue — as the WhatsApp service.
Nothing money-related is decided in the app: the app quotes, the customer
approves with their PIN, the server executes, and the app renders what came back.

Sign-in is the only way in. Accounts are opened, and PINs are reset, by the Nella
team on WhatsApp; the app links there instead of pretending to do identity
verification itself.

## Covered in the app

| Function            | In the app                                                                                  | Backed by                                              |
| ------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Sign in             | Phone + 4-digit PIN, session bound to the device, one silent refresh, then signed out        | `POST /auth/login`, `/auth/refresh`, `/auth/logout`     |
| Wallet balance      | Live balance from the customer's VFD account                                                | `GET /balance`                                          |
| Transfers           | Recipient lookup, quote (fee + total), PIN approval, execution, receipt                      | `POST /transfers/quote`, `/transfers/execute`           |
| Airtime and data    | Provider, number, amount or bundle, quote, PIN approval, receipt                            | `/bills/billers`, `/bills/items`, `/bills/quote`        |
| Electricity and TV  | Meter/smartcard validation, quote, PIN approval, token where the biller returns one         | `/bills/validate`, `/bills/quote`, `/bills/execute`     |
| Activity            | Ledger history, newest first, with the reference on every line                              | `GET /history`                                          |
| Receipts            | Full receipt from the reference, plus the PDF the backend generates                         | `GET /receipt`, `/receipt/pdf`                          |
| Beneficiaries       | Recipients saved after a payment, with their bank and account number                        | `GET /beneficiaries`                                    |
| Insights            | Money in / money out over recent transactions                                               | `GET /history`                                          |
| Support             | Opens WhatsApp with the Nella support number; nothing is sent until the customer sends it   | `https://wa.me/2348079574994`                           |

## Handled on WhatsApp, by design

These are real functions of the Nella service that this build deliberately sends
to a person rather than implementing in the app:

| Function                   | What the app says / does                                                    |
| -------------------------- | --------------------------------------------------------------------------- |
| Account opening and KYC    | Explains that opening an account happens with the team on WhatsApp          |
| PIN change and recovery    | Sends the customer to support, who verify identity before resetting         |
| Freezing a lost device     | Sends the customer to support                                              |
| New-customer sign-up       | The sign-in page offers WhatsApp; there is no in-app registration           |
| Disputes and refunds       | Opens support with the reference already in the message                      |
| Business / merchant tools  | Out of scope for this build; not offered in the app                          |

## Payment and receipt contract, as implemented

1. A quote resolves the recipient or biller, validates the customer number, and
   returns the amount, the fee and the total debit with an expiry.
2. The customer approves with their PIN in a private sheet, never in the chat
   transcript. The server checks the PIN and the quote's expiry.
3. Execution is idempotent and single-shot. An ambiguous provider result is
   surfaced as uncertain, never retried blindly, and reconciled by the backend.
4. A receipt is only rendered from what the backend returns for the reference,
   so the app cannot invent a payment. A failed receipt fetch does not erase a
   successful payment.
5. The quote is cancelled, not edited in place, when the customer changes their
   mind; cancelled payments say plainly that nothing was sent.

## Not in this build

Push notifications, in-app statements export, scheduled/recurring payments,
referrals and the merchant/business console are not part of this release. The
app says so rather than showing an empty feature.

## Verification status

- Type check, unit tests (52) and lint are green in this repository.
- The mobile API was exercised end to end on the dev stack (`dev.usenella.com`,
  VFD sandbox): login, balance, history, airtime quote, receipt, and CORS
  preflight from a native origin.
- The dev sandbox catalogue only carries some billers (MTN airtime is missing
  there); airtime is verified against the production catalogue, which is the one
  the store build uses.
- Production still answers `410` on `/api/mobile/v1` until `dev` is merged to
  `main` and deployed; the store build must not be submitted before that.
