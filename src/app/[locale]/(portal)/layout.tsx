import { setRequestLocale } from "next-intl/server";
import { BackgroundWaves } from "@/components/shell/background-waves";
import { PortalShell } from "@/features/session/portal-shell";

// Shell con sesión: header, menú lateral en escritorio y barra inferior en celular.
export default async function PortalLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <BackgroundWaves />
      <PortalShell>{children}</PortalShell>
    </div>
  );
}
