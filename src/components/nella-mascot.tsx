import wave from "@/assets/nella-wave.png";
import { cn } from "@/lib/utils";

export function NellaMascot({ className, small = false }: { className?: string; small?: boolean }) {
  return (
    <div className={cn("nella-mascot relative shrink-0", small ? "h-10 w-10 overflow-hidden rounded-full bg-secondary" : "h-40 w-40", className)}>
      <img src={wave} alt={small ? "" : "Nella waving hello"} className={cn("h-full w-full object-contain", small && "scale-[1.65] translate-y-2")} />
    </div>
  );
}