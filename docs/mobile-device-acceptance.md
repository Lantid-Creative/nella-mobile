# Mobile UX batch — acceptance checks

## Browser verification completed

- Normal demo login: formatted phone, invalid PIN feedback, automatic login on fourth valid PIN digit.
- New customer: profile setup resumes after refresh without PIN inputs; KYC address/review checkpoints resume, acknowledgment must be renewed, chat stays gated until completion.
- Chat: active breakdown amount edit preserves bank, recipient and narration; prepare-again opens a fresh review. Private approval closes and clears on backgrounding.
- Voice with Chromium's simulated microphone: hold to record, release to review, playback control, explicit send, slide-left cancellation and simulated background cancellation.
- Chat layout at 320×568, 393×460, 393×852, 852×393 and 1280×1800: no document horizontal overflow, composer remains inside viewport.
- No page errors observed during the exercised flows. All banking, KYC and PIN approval remain demo-only. Attachments are session-only; reloaded chat does not retain photo/audio content. No offline message queue exists.

## Physical-device testing — outstanding

No physical iPhone or Android device is available in this workspace. Browser emulation and fake microphones do not establish real camera, biometric, keyboard or call-interruption behavior.

On a current iPhone/Safari and Android/Chrome, plus a smaller/slower device:

1. Login with the test account; trigger an invalid PIN, use PIN fallback and device biometrics where available.
2. Create a distinct demo account; leave and return at profile, PIN, each KYC checkpoint and biometric offer. Confirm no private PIN is restored and chat cannot skip KYC setup.
3. Open the keyboard, type multiline and use IME composition. Check portrait/landscape and enlarged text; composer and private approval controls must remain reachable.
4. Prepare transfer, airtime, data and bills; edit recipient/provider/amount/plan, cancel and prepare again. Review must never imply verified execution.
5. Snap to pay with the phone camera: zoom, cancel, retake, choose gallery, deny permission and caption with keyboard open. Cancel must leave no accidental attachment.
6. Hold the microphone, release to review, play back, discard and slide left to cancel. Deny permission, answer a call, switch apps and lock the phone while recording. Microphone must stop and no note may be sent automatically.
7. Background private approval after entering part of a test PIN. Return: approval input must be cleared; editable payment details may remain only in the active session.
8. Toggle airplane mode and reconnect. No queued-message or money-moved claim may appear. Review support/accessibility with VoiceOver and TalkBack.

Record device/OS/browser, outcome and reproduction steps for failures. Complete these checks before claiming physical-device readiness.
