import { CreditCard } from "lucide-react";
import { colors } from "@/lib/theme/colors";
import { cn } from "@/lib/utils";

const STYLES: Record<string, { label: string; bg: string }> = {
  VISA: { label: "VISA", bg: colors["card-visa"] },
  MC: { label: "MC", bg: colors["card-mc"] },
  AMEX: { label: "AMEX", bg: colors["card-amex"] },
  DISCOVER: { label: "DISC", bg: colors["card-discover"] },
};

// Logo chico de la marca de la tarjeta; sin marca, ícono genérico.
export function BrandBadge({ brand, className }: { brand: string | null | undefined; className?: string }) {
  const style = brand ? STYLES[brand] : undefined;
  return (
    <span
      aria-hidden
      className={cn("flex h-7 w-11 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold tracking-wide text-white", className)}
      style={{ background: style?.bg ?? colors["ink-muted"] }}
    >
      {style ? style.label : <CreditCard className="size-4" strokeWidth={2.25} />}
    </span>
  );
}
