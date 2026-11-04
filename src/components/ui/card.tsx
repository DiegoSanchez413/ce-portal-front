import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Tarjeta blanca de las secciones; el padding se ajusta con className cuando la pantalla lo pide.
export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("flex flex-col gap-3.5 rounded-2xl bg-card p-5 shadow-card", className)} {...props} />;
}

// Título en mayúsculas chicas que encabeza una tarjeta ("MY CARDS", "PAY WITH").
export function CardLabel({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-xs font-extrabold tracking-[.06em] text-ink-muted uppercase", className)} {...props} />;
}

// Recuadro interno con borde, para una tarjeta guardada, una opción o un bloque de formulario.
export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2.5 rounded-xl border border-line bg-card px-4 py-3.5", className)} {...props} />;
}
