import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "danger" | "warning" | "info" | "brand" | "neutral";

const TONES: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger-strong",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  brand: "bg-brand-soft text-brand-strong",
  neutral: "bg-line-soft text-body",
};

// Pastilla de estado (Approved, Expired, Monthly payments…); el tono fija los colores de la paleta.
export function Badge({ tone, className, ...props }: ComponentProps<"span"> & { tone: BadgeTone }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap", TONES[tone], className)} {...props} />;
}
