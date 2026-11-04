"use client";

import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Card } from "./card";

// Aviso flotante que se cierra solo a los 3,5 s.
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-[104px] z-[60] mx-auto flex max-w-md items-center gap-2.5 rounded-[14px] bg-navy px-4 py-3.5 text-sm font-bold text-white shadow-toast lg:bottom-8">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-accent">
        <CircleCheck className="size-4" strokeWidth={2.75} aria-hidden />
      </span>
      {message}
    </div>
  );
}

// Carga y error de una sección: esqueleto mientras llega y reintento si falla.
export function QueryState({ loading, error, onRetry, rows = 3 }: { loading: boolean; error: boolean; onRetry: () => void; rows?: number }) {
  const t = useTranslations("Common");
  if (loading) {
    return (
      <div aria-busy className="grid gap-4" aria-label={t("loading")}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-card/70" />
        ))}
      </div>
    );
  }
  if (!error) return null;
  return (
    <Card className="items-center text-center">
      <p className="font-bold">{t("loadError")}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t("retry")}
      </Button>
    </Card>
  );
}

// Estado vacío o resultado dentro de una tarjeta: ícono opcional, título, texto y acciones.
export function EmptyState({ icon, title, children, action, className }: { icon?: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <Card className={cn("items-center gap-3 py-8 text-center", className)}>
      {icon}
      <span className="text-lg font-extrabold">{title}</span>
      {children && <span className="text-[15px] text-body">{children}</span>}
      {action}
    </Card>
  );
}

// Título de la página con subtítulo y, a la derecha, la acción principal.
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
