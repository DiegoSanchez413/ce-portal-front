"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ClientOption } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { AuthCard, AuthTitle } from "./ui";

type Props = {
  clients: ClientOption[];
  busy?: boolean;
  onSelect: (leadId: number) => void;
  onUseDifferentNumber: () => void;
  onBack?: () => void;
};

// Selector de cliente en un celular compartido: nombre corto, servicio y últimos dígitos de la cuenta.
// Desde el portal marca el cliente actual y permite volver sin cambiar.
export function SelectClientStep({ clients, busy, onSelect, onUseDifferentNumber, onBack }: Props) {
  const t = useTranslations("SelectClient");

  return (
    <AuthCard>
      <AuthTitle title={t("title")}>{t("subtitle")}</AuthTitle>
      <ul className="flex flex-col gap-3">
        {clients.map((client) => {
          const [name, service] = client.label.split(" · ");
          return (
            <li key={client.lead_id}>
              <button
                type="button"
                disabled={busy}
                aria-current={client.current ? "true" : undefined}
                onClick={() => (client.current && onBack ? onBack() : onSelect(client.lead_id))}
                className={cn(
                  "flex min-h-[72px] w-full items-center gap-3.5 rounded-[14px] border-[1.5px] bg-card px-[18px] py-3.5 text-left hover:border-brand hover:bg-brand-tint disabled:opacity-60",
                  client.current ? "border-brand bg-brand-tint" : "border-line",
                )}
              >
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-base font-extrabold text-navy">
                    {name}
                    {client.current && (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-extrabold text-brand">{t("current")}</span>
                    )}
                  </span>
                  <span className="text-[13px] font-semibold text-ink-muted">
                    {[service, client.account_hint && t("accountEnding", { digits: client.account_hint })].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <ChevronRight className="size-5 text-faint" strokeWidth={2.25} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      {onBack && (
        <Button variant="outline" block disabled={busy} onClick={onBack}>
          {t("back")}
        </Button>
      )}
      <p className="border-t border-line-soft pt-3 text-center text-[13px] text-ink-muted">
        {t("notYou")}{" "}
        <button type="button" onClick={onUseDifferentNumber} className="font-bold text-brand hover:underline">
          {t("useDifferent")}
        </button>
      </p>
    </AuthCard>
  );
}
