import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Opción de una lista de radio en recuadro (la tarjeta con la que se paga); el contenido lo arma quien la usa.
export function RadioCard({ checked, onSelect, className, children }: { checked: boolean; onSelect: () => void; className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-3 text-left",
        checked ? "border-brand bg-brand-tint" : "border-line bg-card hover:border-line-strong",
        className,
      )}
    >
      <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2", checked ? "border-brand" : "border-line-strong")}>
        {checked && <span className="size-2.5 rounded-full bg-brand" />}
      </span>
      {children}
    </button>
  );
}

// Chip que se prende y apaga (Mobile number, Bureau response…); check muestra la tilde cuando está prendido.
export function ToggleChip({ pressed, check = false, className, children, ...props }: Omit<ComponentProps<"button">, "type"> & { pressed: boolean; check?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "inline-flex min-h-[46px] items-center gap-1.5 rounded-full border-[1.5px] px-[18px] text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-45",
        pressed ? "border-brand bg-brand-soft text-brand-strong" : "border-line-strong bg-card text-navy hover:border-navy",
        className,
      )}
      {...props}
    >
      {pressed && check && <Check className="size-4" strokeWidth={3} aria-hidden />}
      {children}
    </button>
  );
}

// Selector de opciones excluyentes en una píldora gris (EN / ES).
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  disabled,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "md" | "sm";
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex rounded-full bg-muted", size === "md" ? "h-10 p-1" : "h-9 p-[3px]")}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-w-11 rounded-full font-extrabold uppercase hover:text-navy",
            size === "md" ? "px-3.5 text-sm" : "px-3 text-[13px]",
            option.value === value ? "bg-card text-navy shadow-pill" : "text-ink-muted",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Ícono dentro de un recuadro de color (dispositivo en My access, tipo de documento, avisos de Inicio).
export function IconTile({ tone = "neutral", shape = "square", className, children }: { tone?: "neutral" | "brand" | "brand-soft" | "success" | "danger" | "warning" | "info"; shape?: "square" | "circle"; className?: string; children: ReactNode }) {
  const tones = {
    neutral: "bg-surface-alt text-navy",
    brand: "bg-brand text-white",
    "brand-soft": "bg-brand-soft text-brand",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger-strong",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  };
  return <span className={cn("flex size-10 shrink-0 items-center justify-center", shape === "circle" ? "rounded-full" : "rounded-xl", tones[tone], className)}>{children}</span>;
}
