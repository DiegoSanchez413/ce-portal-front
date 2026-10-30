import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const primaryButton =
  "flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-brand px-8 py-3.5 text-base font-extrabold text-white shadow-[0_6px_16px_rgba(242,106,33,.3)] hover:bg-[#db5a15] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-brand";

export const outlineButton =
  "flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-navy bg-card px-8 py-3 text-base font-extrabold text-navy hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-card";

export const textLink = "font-bold text-brand hover:underline";

// Tarjeta blanca centrada de las pantallas de ingreso.
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-[22px] rounded-2xl bg-card px-6 py-8 shadow-[0_4px_20px_rgba(31,42,68,.08)] sm:px-7">
      {children}
    </div>
  );
}

export function AuthTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 text-center">
      <h1 className="text-[26px] leading-tight font-extrabold text-navy">{title}</h1>
      {children && <p className="text-[15px] leading-normal text-[#4b5563]">{children}</p>}
    </div>
  );
}

export function FieldError({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="alert" className={cn("flex items-center gap-1.5 text-[13px] font-semibold text-danger", className)}>
      <CircleAlert className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
      {children}
    </div>
  );
}

export function Banner({ tone, icon, children }: { tone: "danger" | "success"; icon: ReactNode; children: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-snug font-semibold",
        tone === "danger" ? "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]" : "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]",
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}

export function CustomerCareLink() {
  return (
    <a href="tel:+18555170390" className={textLink}>
      (855) 517-0390
    </a>
  );
}
