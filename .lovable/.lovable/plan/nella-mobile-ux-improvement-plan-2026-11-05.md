# Nella mobile UX improvement plan

Goal: make every moment — opening the app, signing in, setting up, chatting and paying — feel fast, calm and obvious on a phone. Branding, chat-first navigation, onboarding/KYC gates and demo safeguards stay exactly as they are.

## 1. First open and sign-in
- Splash: shorten to about 1.2s for returning customers; keep full animation only on first launch.
- Login: one clear screen — phone, PIN, "Unlock with biometrics" when set up. Auto-advance after 4 PIN digits, show/hide PIN, friendly error under the field (not a toast).
- Number formatting as you type (0801 234 5678) and a numeric keypad on phones.
- "Forgot PIN" opens inline, not a new page.

## 2. Sign-up, onboarding and KYC
- Single progress bar across sign-up → KYC → biometrics ("Step 2 of 4").
- Remember progress if the customer leaves mid-way; resume on the same step.
- Nella mascot speaks one short line per step so setup feels like a conversation.
- Large tappable cards for choices; Continue button always above the keyboard.

## 3. Chat home (first screen after setup)
- Personal greeting with time of day and the customer's first name.
- 4 big shortcut tiles: Send money, Airtime, Data, Pay bills — plus Snap to pay.
- Suggestions change once the customer has history (e.g. "Repeat ₦5,000 to GTBank").

## 4. Conversation experience
- Group consecutive messages; show the time only per group and date dividers ("Today", "Yesterday").
- "New messages" pill when scrolled up; tap to jump down.
- Typing indicator with Nella mascot; replies appear with a short, gentle animation.
- Swipe-to-reply and reactions (done) get a one-time tip: "Swipe a message to reply."
- Long-press menu adds Copy text.
- Failed or blocked actions show a clear inline card with a retry button.

## 5. Payments in chat
- Persistent step tracker on the active payment ("Recipient ✓ · Amount ✓ · Review").
- "Edit" chips on the breakdown card to change one detail without restarting.
- Cancel payment always visible while a payment is in progress.
- Approval PIN sheet: auto-submit on 4th digit, shake on wrong PIN, biometrics shown as a future option only (never replaces PIN).
- Bank/plan lists: search box at the top when the list is longer than 8.

## 6. Snap to pay and voice notes
- Camera: guide frame and "Hold steady" hint; zoom stays.
- Voice: hold-to-record button with slide-to-cancel, like WhatsApp.

## 7. Profile (top right)
- Clean sheet: name, phone, setup status, biometrics toggle, security, support, sign out.
- Sign-out asks for confirmation.

## 8. Polish across the app
- Haptic taps on key actions (where the phone supports it).
- Consistent spacing, 44px touch targets, larger text support, dark mode check.
- Offline banner: "You're offline — messages will send when you reconnect."
- Skeleton loading instead of blank screens.

## Suggested order
1. Conversation experience + chat home (biggest daily impact)
2. Payments in chat
3. Login and setup polish
4. Snap/voice, profile, overall polish

## Technical details
- Grouping/date dividers and "new messages" pill in the chat route using existing scroll helpers.
- Payment step tracker and edit chips extend the shared conversational payment state machine; no payment-entry windows.
- Setup progress stored with the demo account; validated on read.
- Tests added for: PIN auto-submit, setup resume step, message grouping, payment edit keeping other details.
- No backend changes; all money flows remain demo-only.
