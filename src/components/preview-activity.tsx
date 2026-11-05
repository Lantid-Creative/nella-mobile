import { useState } from "react";
import { ArrowLeft, ArrowRight, Download, FileText, Search, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { naira } from "@/lib/demo-store";
import { SERVICE_LABELS, previewReceiptText, type MoneyService, type PaymentDraft, type ReceiptPreview } from "@/lib/app-provisions";
import { draftFromPreview, filterPreviews } from "@/lib/preview-workspace";

export function downloadPreview(receipt: ReceiptPreview) {
  const url = URL.createObjectURL(new Blob([previewReceiptText(receipt)], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = "nella-payment-preview.txt"; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PreviewActions({ receipt }: { receipt: ReceiptPreview }) {
  const [notice, setNotice] = useState("");
  const share = async () => {
    const text = previewReceiptText(receipt);
    try {
      if (navigator.share) await navigator.share({ title: "Nella payment preview — not submitted", text });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); setNotice("Preview copied. This is not proof of payment."); }
      else setNotice("Sharing is unavailable here. Download the preview instead.");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setNotice("Couldn’t share this preview. Download it instead.");
    }
  };
  return <div><div className="grid grid-cols-2 gap-2"><Button variant="outline" className="h-12" onClick={() => downloadPreview(receipt)}><Download />Download</Button><Button variant="outline" className="h-12" onClick={() => void share()}><Share2 />Share preview</Button></div>{notice && <p role="status" className="mt-2 text-xs text-muted-foreground">{notice}</p>}</div>;
}

export function PreviewActivity({ previews, onReuse }: { previews: ReceiptPreview[]; onReuse: (draft: PaymentDraft) => void }) {
  const [query, setQuery] = useState("");
  const [service, setService] = useState<MoneyService | "all">("all");
  const [selected, setSelected] = useState<ReceiptPreview | null>(null);
  if (selected) {
    const draft = draftFromPreview(selected);
    return <div className="space-y-5"><Button variant="ghost" className="h-11 px-0" onClick={() => setSelected(null)}><ArrowLeft />All previews</Button><div><p className="text-xs font-semibold text-muted-foreground">NOT SUBMITTED</p><h3 className="mt-2 font-bold">{selected.title}</h3><p className="mt-2 break-all text-2xl font-extrabold">{naira(selected.amount)}</p></div><dl className="divide-y divide-border">{selected.rows.map(([key, value], index) => <div key={`${key}-${index}`} className="grid grid-cols-2 gap-3 py-3 text-sm"><dt className="text-muted-foreground">{key}</dt><dd className="break-words text-right font-semibold">{value}</dd></div>)}</dl><PreviewActions receipt={selected} />{draft && <Button className="h-12 w-full" onClick={() => onReuse(draft)}>Use these details<ArrowRight /></Button>}<p className="text-xs text-muted-foreground">Reusing details prepares a new draft. No payment is sent.</p></div>;
  }
  const matches = filterPreviews(previews, query, service).slice().reverse();
  return <section className="space-y-4"><div className="border-b border-border pb-4"><p className="text-xs font-semibold text-primary">PREVIEW ACTIVITY</p><h3 className="mt-2 text-lg font-bold">Your prepared payments</h3><p className="mt-1 text-sm text-muted-foreground">No verified transactions. These previews were never submitted.</p></div>{previews.length > 0 ? <><label className="relative block"><Search className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" /><input aria-label="Search payment previews" className="h-12 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-base" placeholder="Search amount, bank or recipient" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="Filter payment previews" className="h-12 w-full rounded-lg border border-input bg-card px-3 text-base" value={service} onChange={event => setService(event.target.value as MoneyService | "all")}><option value="all">All services</option>{(Object.keys(SERVICE_LABELS) as MoneyService[]).map(key => <option key={key} value={key}>{SERVICE_LABELS[key]}</option>)}</select><div className="divide-y divide-border">{matches.map((receipt, index) => <Button key={index} variant="ghost" className="h-auto min-h-20 w-full justify-between gap-3 whitespace-normal px-0 text-left" onClick={() => setSelected(receipt)}><span className="min-w-0"><span className="block font-semibold">{receipt.title}</span><span className="mt-1 block break-all text-sm">{naira(receipt.amount)}</span><span className="mt-1 block text-xs text-muted-foreground">Not submitted</span></span><ArrowRight className="shrink-0" /></Button>)}</div>{matches.length === 0 && <p role="status" className="py-8 text-center text-sm text-muted-foreground">No previews match your search.</p>}</> : <div className="py-8 text-center"><FileText className="mx-auto mb-3 h-8 w-8 text-primary" /><p className="font-semibold">No prepared payments yet</p><p className="mt-2 text-sm text-muted-foreground">Kept payment previews appear here, separate from real transactions.</p></div>}</section>;
}