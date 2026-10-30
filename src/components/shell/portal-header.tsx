import { Phone } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AccountSwitch } from "./account-switch";
import { LanguageSwitch } from "./language-switch";
import { UserMenu, type PortalUser } from "./user-menu";

type Props =
  | { variant: "public" }
  | { variant: "portal"; user: PortalUser | null };

// Header del portal: teléfono (escritorio), logo, idioma y, con sesión, el avatar.
export function PortalHeader(props: Props) {
  const t = useTranslations("Header");
  const loggedIn = props.variant === "portal";

  return (
    <div className="relative z-20 px-4 pt-4">
      <header className="flex min-h-[72px] items-center gap-3 rounded-2xl border-b-[3px] border-brand bg-card px-4 shadow-[0_2px_12px_rgba(31,42,68,.08)]">
        <div className="hidden min-w-0 flex-1 lg:flex">
          <a
            href="tel:+18555170390"
            className="flex h-11 items-center gap-2 rounded-full border border-line px-4 text-[15px] font-semibold whitespace-nowrap"
          >
            <Phone className="size-4 text-brand" strokeWidth={2.25} aria-hidden />
            {t("phone")}
          </a>
        </div>
        <div className="flex min-w-0 flex-auto items-center gap-2.5 lg:flex-none">
          <Image
            src="/creditexperts-logo.png"
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full"
            priority
          />
          <span className="text-[17px] font-extrabold whitespace-nowrap">
            {t("brand")}
          </span>
        </div>
        <div className="flex flex-none items-center justify-end gap-2.5 lg:flex-1">
          <div className={loggedIn ? "hidden lg:block" : undefined}>
            <LanguageSwitch />
          </div>
          {loggedIn && <AccountSwitch />}
          {loggedIn && <UserMenu user={props.user} />}
        </div>
      </header>
    </div>
  );
}
