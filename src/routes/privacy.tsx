import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { PRIVACY_URL, SUPPORT_EMAIL } from "@/lib/store-links";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Nella" },
      {
        name: "description",
        content:
          "What Nella collects, why we collect it, who we share it with and the choices you have.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy in the app"
      updated="19 November 2026"
      intro={
        <>
          This page explains what the Nella app collects and why. Nella’s full privacy policy lives
          at{" "}
          <a href={PRIVACY_URL} className="text-primary hover:underline">
            {new URL(PRIVACY_URL).hostname}
            {new URL(PRIVACY_URL).pathname}
          </a>{" "}
          and is the document that applies to the service.
        </>
      }
    >
      <section>
        <h2>Who we are</h2>
        <p>
          Nella is a product of Lantid Creative LTD. Banking services — the account your money sits
          in and the transfers and bill payments you make — are provided by VFD Microfinance Bank.
          We are the data controller for the information described here.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong className="text-foreground">Your identity.</strong> Your name, phone number,
            date of birth and address, plus your BVN or NIN and any identity document you provide
            when your account is opened or verified. This is required by law before a Nigerian
            account can be opened, and it is checked with the relevant registries.
          </li>
          <li>
            <strong className="text-foreground">Your account.</strong> Your Nella account number,
            balance, and the phone number and PIN that protect it. Your PIN is stored as a one-way
            hash — nobody at Nella can read it.
          </li>
          <li>
            <strong className="text-foreground">Your payments.</strong> Transfers, airtime, data and
            bill purchases, the recipients and providers involved, amounts, fees, statuses and
            references. Receipts are built from these records.
          </li>
          <li>
            <strong className="text-foreground">Your conversations.</strong> What you and Nella say
            to each other in the app, and on WhatsApp if you contact us there.
          </li>
          <li>
            <strong className="text-foreground">Technical information.</strong> Your device type,
            app version, IP address and the times you sign in, so we can keep the service secure and
            diagnose faults. The app does not use advertising identifiers.
          </li>
          <li>
            <strong className="text-foreground">Media you choose to send.</strong> A photo or voice
            note is only captured when you tap the camera or hold the microphone.
          </li>
        </ul>
      </section>

      <section>
        <h2>Why we use it</h2>
        <ul>
          <li>To open, verify and protect your account.</li>
          <li>To quote, execute and settle the payments you approve.</li>
          <li>To check a recipient’s name with the bank before you send.</li>
          <li>To detect fraud, money laundering and other unlawful use.</li>
          <li>To answer your support requests and keep records the law requires.</li>
        </ul>
        <p>
          We do not sell your information, and we do not use it for advertising. We do not use your
          data to train third-party AI models.
        </p>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>
          Only what each service needs, and only for the purpose it was collected: VFD Microfinance
          Bank and the Nigerian payment switch for account opening, balances and transfers; the
          biller or network you are paying; identity-verification and fraud-prevention providers;
          and our hosting, messaging and support providers. We may also disclose information where
          the law or a regulator requires it.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          Transaction and identity records are kept for as long as your account is open and for the
          period Nigerian financial regulation requires afterwards. Chat history stays available in
          the app while your account is open, and you can delete it from the app at any time.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can ask for a copy of your information, ask us to correct it, withdraw a consent that
          is not required by law, or close your account. Nigerian data protection law (NDPA 2023)
          gives you these rights; we may need to verify your identity before acting. Email{" "}
          <span className="text-foreground">{SUPPORT_EMAIL}</span> or message us on WhatsApp.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Traffic between the app and Nella is encrypted in transit. Your PIN is hashed, payment
          approval needs a fresh PIN entry in a private sheet, and sessions are bound to your device
          and can be revoked. If you lose your phone, contact support and we will end its sessions.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>Nella is for people aged 18 and over. We do not knowingly open accounts for children.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions or requests about privacy:{" "}
          <span className="text-foreground">{SUPPORT_EMAIL}</span>.
        </p>
        <p>
          You may also complain to the Nigeria Data Protection Commission if you are unhappy with
          our response.
        </p>
      </section>
    </LegalPage>
  );
}
