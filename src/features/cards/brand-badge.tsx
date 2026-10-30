import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES: Record<string, { label: string; bg: string }> = {
  VISA: { label: "VISA", bg: "#1A1F71" },
  MC: { label: "MC", bg: "#EB001B" },
  AMEX: { label: "AMEX", bg: "#2E77BC" },
  DISCOVER: { label: "DISC", bg: "#E55C20" },
};

// Logo chico de la marca de la tarjeta; sin marca, ícono genérico.
export function BrandBadge({ brand, className }: { brand: string | null | undefined; className?: string }) {
  const style = brand ? STYLES[brand] : undefined;
  return (
    <span
      aria-hidden
      className={cn("flex h-7 w-11 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold tracking-wide text-white", className)}
      style={{ background: style?.bg ?? "#6B7280" }}
    >
      {style ? style.label : <CreditCard className="size-4" strokeWidth={2.25} />}
    </span>
  );
}
