import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import nellaLogo from "@/assets/nella-nav-logo.png";

/**
 * Shared shell for the legal pages the stores require.
 *
 * Both the App Store and Play require a publicly reachable privacy policy, and
 * the reviewer opens it from the listing — so it has to render on the web build
 * (server-rendered) and in the native shell (prerendered at build:app).
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
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

        <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-muted-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_li]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>

        <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm">
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy
          </Link>
          <Link to="/terms" className="text-primary hover:underline">
            Terms
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
