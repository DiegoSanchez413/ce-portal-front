import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AlertTone = "danger" | "success" | "warning" | "info";

const TONES: Record<AlertTone, { box: string; icon: string; Icon: LucideIcon }> = {
  danger: { box: "border-danger-line bg-danger-tint text-danger-text", icon: "text-danger", Icon: CircleAlert },
  success: { box: "border-success-line bg-success-tint text-success-strong", icon: "text-success", Icon: CircleCheck },
  warning: { box: "border-warning-line bg-warning-tint text-warning-strong", icon: "text-warning-accent", Icon: TriangleAlert },
  info: { box: "border-info-line bg-info-tint text-info-strong", icon: "text-info", Icon: Info },
};

// Aviso en recuadro de color; icon={null} lo quita y action agrega un botón debajo del texto.
export function Alert({ tone, icon, action, className, children }: { tone: AlertTone; icon?: ReactNode | null; action?: ReactNode; className?: string; children: ReactNode }) {
  const { box, icon: iconColor, Icon } = TONES[tone];
  const shown = icon === undefined ? <Icon className={cn("mt-px size-[18px] shrink-0", iconColor)} strokeWidth={2.25} aria-hidden /> : icon;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex flex-col gap-3 rounded-xl border px-3.5 py-3 text-sm leading-snug font-semibold", box, className)}>
      <div className="flex items-start gap-2.5">
        {shown}
        <span className="min-w-0">{children}</span>
      </div>
      {action}
    </div>
  );
}

// Mensaje corto de una línea con ícono: error de un campo o de una acción, o una confirmación.
export function InlineMessage({ tone = "danger", className, children }: { tone?: "danger" | "success"; className?: string; children: ReactNode }) {
  const Icon = tone === "danger" ? CircleAlert : CircleCheck;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex items-center gap-1.5 text-[13px] font-semibold", tone === "danger" ? "text-danger" : "text-success", className)}>
      <Icon className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
      {children}
    </div>
  );
}
