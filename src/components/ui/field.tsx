import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InlineMessage } from "./alert";

// Campo de texto: default es el del portal (borde grueso, texto en negrita) y boxed el de la tarjeta de la mini-app.
export const inputVariants = cva(
  "w-full text-navy outline-none placeholder:font-normal placeholder:text-faint focus:border-brand disabled:cursor-not-allowed disabled:bg-surface-alt aria-invalid:border-danger",
  {
    variants: {
      variant: {
        default: "h-12 rounded-[10px] border-[1.5px] border-line-strong bg-card px-3.5 text-[15px] font-semibold focus:shadow-[0_0_0_3px_var(--color-brand-focus)]",
        boxed:
          "rounded-lg border border-line-strong bg-white px-3.5 py-3 text-base focus:shadow-[0_0_0_3px_var(--color-brand-soft)] aria-invalid:bg-danger-tint aria-invalid:shadow-[0_0_0_3px_var(--color-danger-soft)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Input({ className, variant, ...props }: ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return <input className={cn(inputVariants({ variant }), className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputVariants(), "h-auto min-h-24 resize-y py-3", className)} {...props} />;
}

export function Label({ className, required, children, ...props }: ComponentProps<"label"> & { required?: boolean }) {
  return (
    <label className={cn("text-sm font-bold text-navy", className)} {...props}>
      {children}
      {required && <span className="ml-1 text-danger">*</span>}
    </label>
  );
}

// Rótulo, control y, debajo, el error o una ayuda; el control lo pone quien lo usa (Input, grupo de bloques, etc.).
export function Field({ label, htmlFor, required, error, hint, className, children }: { label?: ReactNode; htmlFor?: string; required?: boolean; error?: ReactNode; hint?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? <InlineMessage>{error}</InlineMessage> : hint && <span className="text-xs font-semibold text-ink-muted">{hint}</span>}
    </div>
  );
}

// Casilla en recuadro: toda la fila se toca; marcada, borde naranja, fondo suave y casilla llena con la tilde.
// La casilla real queda oculta (sr-only) para el teclado y los lectores de pantalla.
export function Checkbox({ label, className, checked, ...props }: Omit<ComponentProps<"input">, "type"> & { label: ReactNode }) {
  return (
    <label
      className={cn(
        "group flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 text-sm font-bold text-navy transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45",
        checked ? "border-brand bg-brand-tint" : "border-line bg-white hover:border-line-strong",
        className,
      )}
    >
      <input type="checkbox" checked={checked} className="peer sr-only" {...props} />
      <span
        aria-hidden
        className={cn(
          "flex size-[22px] shrink-0 items-center justify-center rounded-[5px] border-2 transition-colors peer-focus-visible:ring-[3px] peer-focus-visible:ring-brand-focus",
          checked ? "border-brand bg-brand text-white" : "border-line-strong bg-white group-hover:border-brand",
        )}
      >
        <Check className={cn("size-3.5 transition-transform", checked ? "scale-100" : "scale-0")} strokeWidth={3.5} />
      </span>
      {label}
    </label>
  );
}
