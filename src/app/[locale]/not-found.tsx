"use client";

import { useTranslations } from "next-intl";
import { BackgroundWaves } from "@/components/shell/background-waves";
import { PortalHeader } from "@/components/shell/portal-header";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthTitle } from "@/features/auth/ui";
import { Link } from "@/i18n/navigation";

// Página 404 con el marco público del portal y un enlace de vuelta al inicio.
export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <BackgroundWaves />
      <PortalHeader variant="public" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
        <AuthCard>
          <AuthTitle title={t("title")}>{t("subtitle")}</AuthTitle>
          <Button asChild block>
            <Link href="/">{t("home")}</Link>
          </Button>
        </AuthCard>
      </main>
    </div>
  );
}
