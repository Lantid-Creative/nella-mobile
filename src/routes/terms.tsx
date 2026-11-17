import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { SUPPORT_EMAIL, TERMS_URL } from "@/lib/store-links";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Nella" },
      {
        name: "description",
        content:
          "Terms for the Nella preview build on iOS and Android. Nothing in this version moves money.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      title="Terms for the app"
      updated="17 November 2026"
      intro={
        <>
          These terms cover the app on your phone. Nella’s full terms of service live at{" "}
          <a href={TERMS_URL} className="text-primary hover:underline">
            {new URL(TERMS_URL).hostname}
            {new URL(TERMS_URL).pathname}
          </a>
          .
        </>
      }
    >
      <section>
        <h2>This is a preview</h2>
        <p>
          Nella is not a bank, a payment service or a money transfer operator in this release. The
          app cannot move money, receive money or open an account. Anything you prepare is a
          demonstration that stops before submission.
        </p>
      </section>

      <section>
        <h2>Your demo data</h2>
        <p>
          The account, chats and payment previews you create live on your device and nowhere else.
          Deleting the app deletes them. Do not enter real banking credentials, card numbers or
          identity documents — we do not ask for them and cannot protect them.
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
          disappear between releases.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the extent the law allows, and without limiting any right you have under the full terms
          of service, we are not liable for any loss arising from your use of the preview, including
          loss of the demo data stored on your device.
        </p>
      </section>

      <section>
        <h2>When live banking arrives</h2>
        <p>
          Connecting real accounts will come with its own terms and eligibility checks, which you
          will be asked to accept before any real account is opened. Those will build on the full
          terms of service, not replace them.
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
