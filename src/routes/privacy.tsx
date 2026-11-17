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
          "What the Nella preview build does on your phone: everything stays on the device, nothing is uploaded and nothing is tracked.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy in the app"
      updated="17 November 2026"
      intro={
        <>
          This page covers the app on your phone. Nella’s full privacy policy lives at{" "}
          <a href={PRIVACY_URL} className="text-primary hover:underline">
            {new URL(PRIVACY_URL).hostname}
            {new URL(PRIVACY_URL).pathname}
          </a>
          .
        </>
      }
    >
      <section>
        <h2>This build runs on your device</h2>
        <p>
          The preview has no Nella server to send anything to. No account is created, no bank is
          connected, and no payment can be completed.
        </p>
      </section>

      <section>
        <h2>What we collect in this build</h2>
        <p>
          <strong className="text-foreground">Nothing.</strong> We do not collect, transmit, sell or
          share any information about you in this version.
        </p>
      </section>

      <section>
        <h2>What stays on your phone</h2>
        <p>
          The name, phone number and PIN you type during setup are saved in the app’s local storage
          so the preview can remember your session. Your chat history and any payment details you
          prepare are saved in the same place. All of it stays on the device, is never uploaded, and
          is removed when you clear the app’s data or uninstall it.
        </p>
        <p>
          The PIN here is a demo PIN. It is compared on your device and protects nothing, because
          there is nothing real to protect yet.
        </p>
      </section>

      <section>
        <h2>Camera and microphone</h2>
        <p>
          Nella asks for the camera only when you choose to snap a bill, and for the microphone only
          while you hold to record a voice note. The photo or recording is shown back to you on the
          device. Nothing is uploaded, and the app does not use either one in the background.
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
        <h2>When live banking arrives</h2>
        <p>
          Connecting real accounts will mean Nella processes personal and financial information on a
          server. Before that happens the full policy at{" "}
          <a href={PRIVACY_URL} className="text-primary hover:underline">
            {new URL(PRIVACY_URL).pathname}
          </a>{" "}
          will be updated, the in-app screens will say what is collected, and both stores’ privacy
          labels will change. This page will never quietly cover data that was collected under
          different terms.
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
