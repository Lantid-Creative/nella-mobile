import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import nellaLogo from "@/assets/nella-nav-logo.png";
import { PRIVACY_URL, SECURITY_URL, SITE_URL, SUPPORT_URL, TERMS_URL } from "@/lib/store-links";

/**
 * Shared shell for the in-app legal pages.
 *
 * These pages describe what *this build* does on the phone. The legally binding
 * documents live on the marketing site, and every page here links out to them
 * rather than restating them — two copies of a policy drift apart, and a
 * reviewer who reads both should never find them disagreeing.
 */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-background px-5 py-10 text-foreground">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/" className="inline-block" aria-label="Nella home">
          <img src={nellaLogo} alt="Nella" className="h-7 w-auto" />
        </Link>

        <h1 className="mt-8 text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
        {intro ? (
          <div className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{intro}</div>
        ) : null}

        <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-muted-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_li]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground">The full documents</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nella is a product of Harrena Africa Synergy LTD. The policies that govern the service
            live on {new URL(SITE_URL).hostname}:
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <a href={PRIVACY_URL} className="text-primary hover:underline">
                Privacy policy
              </a>
            </li>
            <li>
              <a href={TERMS_URL} className="text-primary hover:underline">
                Terms of service
              </a>
            </li>
            <li>
              <a href={SECURITY_URL} className="text-primary hover:underline">
                Security
              </a>
            </li>
            <li>
              <a href={SUPPORT_URL} className="text-primary hover:underline">
                Contact and support
              </a>
            </li>
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm">
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy in the app
          </Link>
          <Link to="/terms" className="text-primary hover:underline">
            App terms
          </Link>
          <Link to="/support" className="text-primary hover:underline">
            Help
          </Link>
          <Link to="/auth" className="text-primary hover:underline">
            Back to the app
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Preview build · No real money moves · No data leaves this device
        </p>
      </div>
    </main>
  );
}
