import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { SUPPORT_EMAIL } from "@/lib/store-links";

const WHATSAPP = "https://wa.me/2348079574994";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Nella" },
      {
        name: "description",
        content:
          "Talk to the Nella team about your account, a payment or anything that looks wrong.",
      },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <LegalPage title="Help" updated="19 November 2026">
      <p>
        The fastest way to reach a person is WhatsApp on{" "}
        <a
          href={WHATSAPP}
          className="text-primary hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          +234 807 957 4994
        </a>
        . You can also email <span className="text-foreground">{SUPPORT_EMAIL}</span>. For a payment
        question, include the reference from your receipt and what happened — never your PIN, OTP or
        bank password.
      </p>

      <section>
        <h2>If a payment looks wrong</h2>
        <p>
          Open <strong className="text-foreground">Activity &amp; receipts</strong> in the app, find
          the payment and send us its reference. We can see the same record, so you do not need to
          describe every number. If money left your account to the wrong person, tell us straight
          away: the sooner the receiving bank is asked, the better the chance of a return.
        </p>
      </section>

      <section>
        <h2>If you forgot your PIN</h2>
        <p>
          Message us on WhatsApp and we will verify it is you before helping you set a new one. For
          your safety, outbound transfers are paused for 24 hours after a PIN reset; your balance
          and purchases still work.
        </p>
      </section>

      <section>
        <h2>If your phone is lost or stolen</h2>
        <p>
          Contact us immediately so we can end the sessions on that device. You can also freeze your
          account from <strong className="text-foreground">Security &amp; PIN</strong> in the app. A
          request is only complete once we confirm it.
        </p>
      </section>

      <section>
        <h2>Opening an account</h2>
        <p>
          New accounts are opened with our team rather than from inside the app. Message us on
          WhatsApp and we will take you through the identity checks the bank requires.
        </p>
      </section>

      <section>
        <h2>Opening hours</h2>
        <p>
          We reply on WhatsApp during working hours, Monday to Saturday, and usually within a few
          minutes. Payments themselves run 24 hours a day, subject to the banks and networks.
        </p>
      </section>

      <section>
        <h2>Stay alert to impersonation</h2>
        <p>
          Nella support will never ask you to send money to a personal account, and will never ask
          for your PIN or a one-time code. If someone claiming to be Nella does, stop and report it
          to us through the channels above.
        </p>
      </section>
    </LegalPage>
  );
}
