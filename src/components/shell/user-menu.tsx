"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/features/session/session-context";
import { Link } from "@/i18n/navigation";
import { LanguageSwitch } from "./language-switch";

export type PortalUser = {
  name: string;
  initials: string;
  account: string;
  sharedPhone: boolean;
};

// Avatar con el menú de la cuenta; en celular también lleva el cambio de idioma.
export function UserMenu({ user }: { user: PortalUser | null }) {
  const t = useTranslations("Header");
  const actions = useSession();
  const onSignOut = actions?.signOut;
  const onSwitchAccount = actions?.switchClient;

  return (
    <div className="flex items-center gap-2.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t("accountMenu")}
          className="flex min-h-11 items-center gap-2.5 rounded-full p-1 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-brand text-[13px] font-extrabold text-white">
            {user?.initials ?? ""}
          </span>
          {user && (
            <span className="hidden text-[15px] font-bold text-navy lg:inline">
              {user.name}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-66 rounded-[14px] border-line-soft p-2 shadow-[0_14px_40px_rgba(31,42,68,.18)]"
        >
          {user && (
            <>
              <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 pt-3 pb-2.5">
                <span className="text-[15px] font-extrabold">{user.name}</span>
                <span className="text-[13px] font-normal text-ink-muted">
                  {t("account", { account: user.account })}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-2 bg-line-soft" />
            </>
          )}
          <div className="flex min-h-11 items-center justify-between px-3 py-1 lg:hidden">
            <span className="text-[15px] font-semibold">{t("language")}</span>
            <LanguageSwitch size="sm" />
          </div>
          <DropdownMenuSeparator className="mx-2 bg-line-soft lg:hidden" />
          {user?.sharedPhone && (
            <DropdownMenuItem
              onSelect={onSwitchAccount}
              className="min-h-11 rounded-[10px] px-3 text-[15px] font-semibold"
            >
              {t("switchAccount")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            asChild
            className="min-h-11 rounded-[10px] px-3 text-[15px] font-semibold"
          >
            <Link href="/access">{t("myAccess")}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="min-h-11 rounded-[10px] px-3 text-[15px] font-semibold"
          >
            <Link href="/profile">{t("profile")}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onSignOut}
            className="min-h-11 rounded-[10px] px-3 text-[15px] font-semibold text-danger focus:text-danger"
          >
            {t("signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        type="button"
        aria-label={t("signOut")}
        onClick={onSignOut}
        className="hidden size-10 items-center justify-center rounded-full border border-line bg-card text-navy hover:bg-muted lg:flex"
      >
        <LogOut className="size-[18px]" strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}
