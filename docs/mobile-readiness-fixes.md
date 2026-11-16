# Current-source fixes: mobile readiness

Reviewed 5 November 2026. Read-only code inspection, not a new runtime/device test. Prior browser checks remain historical evidence only.

## Block real-account launch

- Browser-local plaintext demo PIN, editable session and phone-only demo reset must never authorize a real customer or payment. Replace with authenticated server-side sessions and verified recovery; hashing in the browser alone is insufficient.
- Connected quote/private approval/idempotency/reconciliation are absent. Disabled payment buttons and preview-only identifiers are correct safeguards, not delivered money movement.

## Fix before mobile UX approval

1. **Late replies and focus:** chat reply timers are not cancelled on clear/logout/unmount; replies unconditionally focus the composer. Cancel work and do not reopen the keyboard or interrupt a sheet.
2. **History reading:** every message/typing update scrolls to the end. Preserve position away from the bottom and show a new-message indicator.
3. **Drafts and navigation:** keyed sheet bodies reset payment/support input; nested sheets lack consistent parent/back history. Retain drafts and handle Back before leaving chat.
4. **Keyboard-open sheets:** chat tracks visual viewport height; portalled sheets use viewport units instead. Keep navigation/actions reachable with keyboard open on real iOS/Android devices. Keyboard occlusion is a risk, not yet reproduced.
5. **Storage errors:** valid JSON of the wrong shape can crash `.map()`; writes do not handle quota/disabled storage. Validate/version data and show memory-only state when saving fails.
6. **Intent errors:** broad `fund` matching sends “refund” to funding; “forgot PIN”/“recover account” miss security. Add ordered whole-intent coverage and regression tests without changing existing detailed-payment behavior accidentally.
7. **Long content:** bound references/plans/amount input sensibly and wrap long profile/account names. Verify extreme values and 200% text, rather than claiming current overflow.
8. **Accessibility:** preserve IME composition, visible composer focus, touch-accessible multiline entry, 44px targets and reduced motion for status indicators too.

## Keep availability claims accurate

- Most service sheets are empty states or requirements, not connected functionality.
- Static bank/biller lists and free-text plans are placeholders, not live catalogue availability.
- Support drafts disappear on closing; preserve/export before promising retention.
- Statement UI currently offers 30/90/365 presets, not arbitrary 1–365-day source support.
- Personal automatic recurring transfers remain unsupported.

## Add repeatable tests

- Timer cancellation, clear-during-reply, focus ownership and pending state.
- Draft retention, nested back/close behavior, storage corruption/quota, refund/recovery intents.
- Mobile keyboard-open forms, long-content wrapping, reading-history stability, IME input, screen-reader/focus checks.
- Real authenticated lifecycle and provider event readback before any live-account readiness claim.

Evidence: `src/routes/chat.tsx`, `src/routes/index.tsx`, `src/components/nella-services.tsx`, `src/lib/demo-store.ts`, `src/lib/app-provisions.ts`, `src/styles.css`, `src/lib/*.test.ts`, `src/test/app-routing.test.tsx`.
