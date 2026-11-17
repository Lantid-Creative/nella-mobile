import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { SUPPORT_EMAIL } from "@/lib/store-links";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Nella" },
      {
        name: "description",
        content:
          "Terms for the Nella preview build. Nothing in this version moves money, and the app is provided as-is while live banking is built.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="17 November 2026">
      <p>
        These terms cover the current Nella preview. By using the app you accept them. They are
        short because the preview deliberately does very little.
      </p>

      <section>
        <h2>This is a preview</h2>
        <p>
          Nella is not yet a bank, a payment service or a money transfer operator. The app cannot
          move money, cannot receive money and cannot open an account. Anything you prepare is a
          demonstration that stops before submission.
        </p>
      </section>

      <section>
        <h2>Your demo data</h2>
        <p>
          The account, chats and payment previews you create live on your device and nowhere else.
          Deleting the app deletes them. Do not enter real banking credentials, card numbers or
          identity documents into this preview — we do not ask for them and cannot protect them.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>
          Use the preview to explore Nella and to tell us what works. Do not use it to impersonate
          anyone, to attempt fraud, or to reverse-engineer the app for a competing product.
        </p>
      </section>

      <section>
        <h2>No warranty</h2>
        <p>
          The preview is provided as-is, without warranties of any kind. Because it cannot move
          money, it also cannot lose any — but it may still contain bugs, and features may change or
          vanish between releases.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the extent the law allows, we are not liable for any loss arising from your use of the
          preview, including loss of the demo data stored on your device.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          Live banking will arrive with its own terms, which you will be asked to accept before any
          real account is opened. Those terms will replace these.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms: <span className="text-foreground">{SUPPORT_EMAIL}</span>.
        </p>
      </section>
    </LegalPage>
  );
}
