"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ClientOption } from "@/lib/api/types";
import { AuthCard, AuthTitle } from "./ui";

type Props = {
  clients: ClientOption[];
  busy?: boolean;
  onSelect: (leadId: number) => void;
  onUseDifferentNumber: () => void;
};

// Selector de cliente en un celular compartido: nombre corto y servicio, nada más.
export function SelectClientStep({ clients, busy, onSelect, onUseDifferentNumber }: Props) {
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
                onClick={() => onSelect(client.lead_id)}
                className="flex min-h-[72px] w-full items-center gap-3.5 rounded-[14px] border-[1.5px] border-line bg-card px-[18px] py-3.5 text-left hover:border-brand hover:bg-[#fffbf8] disabled:opacity-60"
              >
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-base font-extrabold text-navy">{name}</span>
                  {service && <span className="text-[13px] font-semibold text-ink-muted">{service}</span>}
                </span>
                <ChevronRight className="size-5 text-[#9ca3af]" strokeWidth={2.25} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-line-soft pt-3 text-center text-[13px] text-ink-muted">
        {t("notYou")}{" "}
        <button type="button" onClick={onUseDifferentNumber} className="font-bold text-brand hover:underline">
          {t("useDifferent")}
        </button>
      </p>
    </AuthCard>
  );
}
