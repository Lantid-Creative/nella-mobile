import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { SUPPORT_EMAIL, TERMS_URL } from "@/lib/store-links";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Nella" },
      {
        name: "description",
        content: "The terms that apply when you use the Nella app to hold and move money.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      title="Terms for the app"
      updated="19 November 2026"
      intro={
        <>
          These terms cover the Nella app on your phone. Nella’s full terms of service live at{" "}
          <a href={TERMS_URL} className="text-primary hover:underline">
            {new URL(TERMS_URL).hostname}
            {new URL(TERMS_URL).pathname}
          </a>
          ; if the two ever disagree, the full terms apply.
        </>
      }
    >
      <section>
        <h2>Who we are</h2>
        <p>
          Nella is a product of Lantid Creative LTD. Your account and the payment services you use
          through Nella are provided with VFD Microfinance Bank, which is licensed by the Central
          Bank of Nigeria. Nella is not itself a bank.
        </p>
      </section>

      <section>
        <h2>Opening an account</h2>
        <p>
          You must be at least 18, use a phone number that is yours, and give accurate information.
          We verify your identity with your BVN or NIN before your account can send money. We may
          decline or close an account where verification fails or the law requires it.
        </p>
      </section>

      <section>
        <h2>Your PIN and your device</h2>
        <p>
          Your 4-digit PIN authorises payments. Keep it to yourself: Nella will never ask for it in
          chat, by email or on a call. Anyone with your phone and your PIN can move your money, so
          use a device passcode or biometric unlock, and contact support immediately if your phone
          is lost or you think someone else knows your PIN.
        </p>
      </section>

      <section>
        <h2>Payments</h2>
        <ul>
          <li>
            Every payment is quoted before you approve it: recipient, amount, fee and total. The
            amount you approve is the amount that executes.
          </li>
          <li>
            A successful transfer cannot be reversed by us. If money reaches the wrong account, we
            will help you ask the receiving bank to return it, but we cannot promise a refund.
          </li>
          <li>
            A first payment to a new recipient, or an unusual payment, may be held for your
            protection. We will tell you when that happens and when it clears.
          </li>
          <li>
            Limits apply to single transfers and to the value you can hold. Current limits are shown
            before you approve, and may change with your verification level.
          </li>
        </ul>
      </section>

      <section>
        <h2>Airtime, data and bills</h2>
        <p>
          These are bought from the network or biller you select, at the price shown in the quote.
          Once a purchase is delivered it cannot be cancelled. Electricity tokens and other
          provider-issued values are the provider’s responsibility once issued; if a token does not
          work, contact support with the reference and we will follow it up with the provider.
        </p>
      </section>

      <section>
        <h2>Fees</h2>
        <p>
          Fees are shown in every quote before you approve, and some transfers are free. We will not
          add a charge that was not displayed to you at approval.
        </p>
      </section>

      <section>
        <h2>Availability</h2>
        <p>
          We work to keep Nella available, but the service depends on banks, networks, billers and
          telecommunications providers. Maintenance, outages and provider downtime can interrupt a
          payment. If a payment fails, the quote tells you whether money moved; when it has not, the
          amount stays in your account.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>
          Do not use Nella for fraud, impersonation, money laundering, terrorism financing or any
          unlawful purpose, and do not attempt to break, overload or reverse-engineer the service.
          We may suspend an account and report activity where the law requires it.
        </p>
      </section>

      <section>
        <h2>Our responsibility</h2>
        <p>
          We are responsible for carrying out the instructions you approve with reasonable care and
          skill. We are not responsible for losses caused by you sharing your PIN, by a provider’s
          own failure, or by events outside our reasonable control, except where the law says
          otherwise. Nothing here limits rights you have under Nigerian law.
        </p>
      </section>

      <section>
        <h2>Complaints</h2>
        <p>
          Contact <span className="text-foreground">{SUPPORT_EMAIL}</span> with the reference of the
          payment. We will acknowledge your complaint and investigate it; if you are not satisfied,
          you can escalate it to the bank and to the Central Bank of Nigeria.
        </p>
      </section>

      <section>
        <h2>Changes and governing law</h2>
        <p>
          We may update these terms as the service changes; the date above shows the current
          version, and material changes will be shown in the app before they take effect. These
          terms are governed by the laws of Nigeria.
        </p>
      </section>
    </LegalPage>
  );
}
