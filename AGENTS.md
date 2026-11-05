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
- Compose welcome and chat identity from the shared Nella mascot component, and use design-system buttons for all updated controls.
- Keep new-customer setup inside the public entry page with progressive steps, then navigate directly to chat; this preserves the minimal navigation model.
- Collect payment details through the shared conversational payment state machine and chat composer, never payment-entry sheets; preserve the existing complete-message parser and keep previews distinct from verified transactions. Non-payment account views remain shared sheets.
- Do not collect identity documents or banking PINs in the browser demo; enable secure account verification and provider-backed authorization before accepting sensitive live-account inputs.
- Keep conversational payment drafts scoped to the active demo account in memory, never persist private approval inputs; use shared sheet history for non-payment views and cancellable reply work to preserve mobile navigation and focus.
- Validate browser-preview storage on read and surface failed writes; browser state is never live-account authorization.
- Keep preview search, sharing and draft reuse in the shared preview workspace; reuse only editable details, never approval or provider execution identifiers.
