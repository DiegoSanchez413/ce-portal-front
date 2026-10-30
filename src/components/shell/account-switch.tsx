"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "@/features/session/session-context";

// Selector de cuenta en el header, solo cuando el cliente tiene más de una cuenta Credit Experts.
export function AccountSwitch() {
  const t = useTranslations("Header");
  const actions = useSession();
  if (!actions || actions.session.accounts.length < 2) return null;

  const { session, switchAccount } = actions;
  return (
    <label className="relative flex h-10 items-center">
      <span className="sr-only">{t("selectAccount")}</span>
      <select
        value={session.account.id}
        onChange={(e) => switchAccount(e.target.value)}
        className="h-10 appearance-none rounded-full border border-line bg-card pr-9 pl-4 text-sm font-bold text-navy outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        {session.accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.number}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-ink-muted" aria-hidden />
    </label>
  );
}
