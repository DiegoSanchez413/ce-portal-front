import type { ReactNode } from "react";
import { InlineMessage } from "@/components/ui/alert";

// Tarjeta blanca centrada de las pantallas de ingreso.
export function AuthCard({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col gap-[22px] rounded-2xl bg-card px-6 py-8 shadow-raised sm:px-7">{children}</div>;
}

export function AuthTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 text-center">
      <h1 className="text-[26px] leading-tight font-extrabold text-navy">{title}</h1>
      {children && <p className="text-[15px] leading-normal text-body">{children}</p>}
    </div>
  );
}

export function FieldError({ children, className }: { children: ReactNode; className?: string }) {
  return <InlineMessage className={className}>{children}</InlineMessage>;
}

// Teléfono de Customer Care como texto, sin enlace para llamar.
export function CustomerCarePhone() {
  return <span className="font-bold text-brand">(855) 517-0390</span>;
}
