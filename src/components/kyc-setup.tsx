import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NellaMascot } from "@/components/nella-mascot";

type KycSetupProps = { name: string; phone: string; error: string; onComplete: () => void };

export function KycSetup({ name, phone, error, onComplete }: KycSetupProps) {
  const [step, setStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const titles = ["Let's set up your KYC.", "Your address details.", "Review your KYC setup."];
  return <section className="flex flex-1 flex-col justify-center py-5">
    <div className="mb-5 flex items-center gap-3"><NellaMascot className="h-24 w-24" /><span className="rounded-xl rounded-bl-none bg-secondary px-4 py-2 text-sm font-semibold text-primary">One step at a time</span></div>
    <p className="text-xs font-bold uppercase text-primary">KYC setup · {step + 1} of 3</p>
    <h1 className="mt-2 text-[28px] font-extrabold leading-tight">{titles[step]}</h1>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step === 0 ? "Confirm your profile before moving into chat." : step === 1 ? "For now, we'll use sample address details, not your real address." : "Finish this required demo step before meeting Nella in chat."}</p>
    <div className="mt-6 border-l-2 border-primary pl-4"><p className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-5 w-5 shrink-0 text-primary" />Demo KYC · Not identity verification</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Live verification isn't connected. Don't enter BVN, NIN or upload an ID. No bank account will be opened.</p></div>
    <div className="mt-6">
      {step === 0 ? <><h2 className="flex items-center gap-2 text-sm font-bold"><UserRound className="h-4 w-4 text-primary" />Identity details</h2><Details rows={[["Full name", name], ["Phone number", `+234 ${phone}`], ["Date of birth", "12 June 1995 · Sample"]]} /><p className="mt-3 text-xs text-muted-foreground">Your real date of birth and identity checks will be handled securely when live verification is available.</p></>
      : step === 1 ? <><h2 className="flex items-center gap-2 text-sm font-bold"><MapPin className="h-4 w-4 text-primary" />Sample residential address</h2><Details rows={[["Street", "12 Example Street"], ["City / State", "Ikeja, Lagos"], ["Country", "Nigeria"]]} /><p className="mt-3 text-xs text-muted-foreground">Sample details only. Your actual home address hasn't been collected or checked.</p></>
      : <><Details rows={[["Identity details", "Reviewed · Demo"], ["Address details", "Reviewed · Sample"], ["Live verification", "Not connected"]]} /><label className="mt-5 flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-primary" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} /><span>I understand this completes demo KYC setup only, not real identity verification.</span></label></>}
    </div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <div className="mt-7 space-y-2"><Button className="h-13 w-full rounded-xl font-bold shadow-glow" disabled={step === 2 && !acknowledged} onClick={() => step < 2 ? setStep(step + 1) : onComplete()}>{step === 2 ? "Complete demo KYC setup" : step === 0 ? "Confirm profile" : "Review KYC setup"}<ArrowRight /></Button>{step > 0 && <Button variant="ghost" className="h-12 w-full" onClick={() => setStep(step - 1)}><ArrowLeft />Back</Button>}</div>
  </section>;
}

function Details({ rows }: { rows: [string, string][] }) {
  return <dl className="divide-y divide-border text-sm">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-right font-semibold">{value.startsWith("Reviewed") && <Check className="mr-1 inline h-4 w-4 text-primary" />}{value}</dd></div>)}</dl>;
}