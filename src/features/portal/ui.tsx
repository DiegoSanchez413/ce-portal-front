"use client";

import { CircleCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export { outlineButton, primaryButton, textLink } from "@/features/auth/ui";

export const ghostButton =
  "flex min-h-11 items-center justify-center rounded-full px-3 text-[15px] font-extrabold text-ink-muted hover:text-navy disabled:opacity-45";

export const smallOutlineButton =
  "flex min-h-11 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-navy bg-card px-4 text-sm font-extrabold whitespace-nowrap text-navy hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="mb-0.5 text-2xl font-extrabold lg:mb-1 lg:text-[28px]">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted lg:text-[15px]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-[0_4px_20px_rgba(31,42,68,.06)]", className)}>
      {children}
    </section>
  );
}

export function CardLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-xs font-extrabold tracking-[.06em] text-ink-muted uppercase", className)}>{children}</h2>
  );
}

export function Chip({ fg, bg, children, className }: { fg: string; bg: string; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap", className)}
      style={{ color: fg, background: bg }}
    >
      {children}
    </span>
  );
}

export function SuccessNote({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3.5 py-3 text-sm leading-snug font-semibold text-[#166534]">
      {children}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-[13px] font-semibold text-danger">
      {children}
    </p>
  );
}

// Carga y error de una sección: esqueleto mientras llega y reintento si falla.
export function QueryState({ loading, error, onRetry }: { loading: boolean; error: boolean; onRetry: () => void }) {
  const t = useTranslations("Common");
  if (loading) {
    return (
      <div aria-busy className="grid gap-4" aria-label={t("loading")}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-card/70" />
        ))}
      </div>
    );
  }
  if (!error) return null;
  return (
    <Card className="items-center text-center">
      <p className="font-bold">{t("loadError")}</p>
      <button type="button" onClick={onRetry} className={smallOutlineButton}>
        {t("retry")}
      </button>
    </Card>
  );
}

// Hoja inferior en celular y modal centrado en escritorio.
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  hideTitle = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  hideTitle?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("Common");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(31,42,68,.55)] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col gap-4 overflow-y-auto rounded-t-[20px] bg-card px-5 pt-4 pb-7 shadow-[0_-10px_40px_rgba(31,42,68,.2)] outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom lg:inset-auto lg:top-1/2 lg:left-1/2 lg:w-[480px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[20px] lg:p-7 lg:data-[state=open]:slide-in-from-bottom-0 lg:data-[state=open]:zoom-in-95"
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-line lg:hidden" />
          <div className={cn("flex items-start justify-between gap-3", hideTitle && "lg:-mb-12 lg:justify-end")}>
            <div className="flex flex-col gap-1.5">
              <Dialog.Title className={hideTitle ? "sr-only" : "text-xl leading-snug font-extrabold"}>{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm text-ink-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="hidden size-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-muted lg:flex" aria-label={t("close")}>
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Aviso flotante que se cierra solo.
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[104px] z-[60] mx-auto flex max-w-md items-center gap-2.5 rounded-[14px] bg-navy px-4 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(31,42,68,.3)] lg:bottom-8"
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-whatsapp">
        <CircleCheck className="size-4" strokeWidth={2.75} aria-hidden />
      </span>
      {message}
    </div>
  );
}
