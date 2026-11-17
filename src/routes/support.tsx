import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { SUPPORT_EMAIL } from "@/lib/store-links";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Nella" },
      {
        name: "description",
        content:
          "Get help with the Nella preview build, and see exactly what the preview can and cannot do.",
      },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <LegalPage title="Help" updated="17 November 2026">
      <p>
        Found a bug, or something in the chat feels wrong? Email{" "}
        <span className="text-foreground">{SUPPORT_EMAIL}</span> and a person will read it. Telling
        us which phone you are on and what you tapped just before it went wrong helps most.
      </p>

      <section>
        <h2>What this build can do</h2>
        <ul>
          <li>Chat with Nella and prepare transfers, airtime and data purchases</li>
          <li>See a full payment breakdown before anything is submitted</li>
          <li>Send photos and voice notes inside the conversation</li>
          <li>Switch between light, dark and your phone’s setting</li>
        </ul>
      </section>

      <section>
        <h2>What it cannot do yet</h2>
        <ul>
          <li>Move real money, or receive it</li>
          <li>Connect a bank account</li>
          <li>Verify your identity</li>
          <li>Show real transaction history or balances</li>
        </ul>
        <p>
          None of that is hidden: the app says “preview only” wherever it matters, and every payment
          stops before submission.
        </p>
      </section>

      <section>
        <h2>Forgotten demo PIN</h2>
        <p>
          On the login screen, tap “Forgot demo PIN?”. The account only exists on your device, so
          the reset happens instantly and locally — it is not a security control.
        </p>
      </section>

      <section>
        <h2>Your data</h2>
        <p>
          Everything you enter stays on your phone. To remove it, delete the app or clear its data.
          In-app privacy notes explain this in full.
        </p>
      </section>
    </LegalPage>
  );
}
