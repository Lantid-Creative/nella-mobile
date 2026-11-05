import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { canEnterChat, currentUser } from "@/lib/demo-store";
import { NellaMascot } from "@/components/nella-mascot";
import { LockKeyhole } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Nella — Your money, in a chat" },
    { name: "description", content: "Meet Nella, your friendly money companion. Say hello in chat and take care of money in one place." },
    { property: "og:title", content: "Nella — Your money, in a chat" },
    { property: "og:description", content: "A friendly, chat-first money experience. Say hello to Nella." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }), component: SplashScreen,
});

function SplashScreen() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const go = () => {
      setLeaving(true);
      setTimeout(() => navigate({ to: canEnterChat(currentUser()) ? "/chat" : "/auth", replace: true }), 260);
    };
    const t = setTimeout(go, 1900);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <main
      aria-label="Nella is starting up"
      onClick={() => {
        if (!leaving) {
          setLeaving(true);
          setTimeout(() => navigate({ to: canEnterChat(currentUser()) ? "/chat" : "/auth", replace: true }), 260);
        }
      }}
      className={`splash-surface splash-enter relative flex min-h-dvh select-none flex-col items-center justify-center overflow-hidden px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-center ${leaving ? "splash-leave" : ""}`}
    >
      <div className="relative flex flex-col items-center">
        <div aria-hidden className="splash-orb pointer-events-none absolute -top-6 h-60 w-60 rounded-full bg-orb opacity-70 blur-xl" />
        <NellaMascot className="relative h-44 w-44 drop-shadow-[0_18px_40px_rgb(0_0_0/35%)]" />
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-sidebar-foreground">
          nella<span className="text-ring">.</span>
        </h1>
        <p className="mt-2 text-sm font-medium text-sidebar-foreground/70">Your money, in a chat.</p>
      </div>

      <div role="status" aria-label="Loading Nella" className="mt-14 flex items-center gap-2">
        {[0, 1, 2].map(i => (
          <span key={i} style={{ animationDelay: `${i * 160}ms` }} className="splash-dot h-2 w-2 rounded-full bg-sidebar-foreground/70" />
        ))}
      </div>

      <footer className="absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] px-6">
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-sidebar-foreground/50">
          <LockKeyhole className="h-3.5 w-3.5" /> Preview only · No real money moves
        </p>
      </footer>
    </main>
  );
}
