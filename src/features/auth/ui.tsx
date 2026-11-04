import type { ReactNode } from "react";
import { InlineMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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

export function CustomerCareLink() {
  return (
    <Button asChild variant="link" size="inline" className="font-bold">
      <a href="tel:+18555170390">(855) 517-0390</a>
    </Button>
  );
}
