import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { SUPPORT_EMAIL } from "@/lib/store-links";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Nella" },
      {
        name: "description",
        content:
          "Nella's preview build keeps everything on your device. No account is created, nothing is uploaded and nothing is tracked.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="17 November 2026">
      <p>
        This policy covers the current Nella preview. In this release Nella runs entirely on your
        device: there is no Nella server to send anything to, no account is created, and no bank is
        connected.
      </p>

      <section>
        <h2>What we collect</h2>
        <p>
          <strong className="text-foreground">Nothing.</strong> We do not collect, transmit, sell or
          share any information about you in this version.
        </p>
      </section>

      <section>
        <h2>What stays on your device</h2>
        <p>
          The name, phone number and PIN you type during the demo setup are saved in your device's
          local application storage so the preview can remember your session. Your chat history and
          any payment details you prepare are saved in the same place. All of it stays on the
          device, is never uploaded, and is removed if you clear the app's data or uninstall it.
        </p>
        <p>
          The PIN in this preview is a demo PIN. It is compared on your device and does not protect
          a real account, because there is no real account.
        </p>
      </section>

      <section>
        <h2>Camera and microphone</h2>
        <p>
          Nella asks for the camera only when you choose to snap a bill, and for the microphone only
          while you hold to record a voice note. The photo or recording is shown back to you on the
          device. Nothing is uploaded, and the app does not access either one in the background.
        </p>
      </section>

      <section>
        <h2>Analytics, advertising and tracking</h2>
        <p>
          There are none. The app contains no analytics SDK, no advertising SDK, no crash reporter
          and no tracking technology, and it does not ask for permission to track you across other
          apps or websites.
        </p>
      </section>

      <section>
        <h2>Payments</h2>
        <p>
          No payment can be completed in this preview. Every transfer, airtime purchase and bill you
          prepare is a local preview that stops before submission, and no money moves.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Nella is a money app and is not directed at children. Do not use it if you are under 18.
        </p>
      </section>

      <section>
        <h2>When live banking arrives</h2>
        <p>
          Connecting real accounts will require Nella to process personal and financial information
          on a server. Before that happens we will publish the details here — what is collected,
          why, how long it is kept, who processes it and how to exercise your rights — and we will
          update the app's privacy label in both stores. This policy will never retroactively cover
          data that was collected under different terms.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about privacy: <span className="text-foreground">{SUPPORT_EMAIL}</span>.
        </p>
      </section>
    </LegalPage>
  );
}
