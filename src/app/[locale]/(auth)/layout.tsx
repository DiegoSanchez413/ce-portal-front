import { setRequestLocale } from "next-intl/server";
import { BackgroundWaves } from "@/components/shell/background-waves";
import { PortalHeader } from "@/components/shell/portal-header";

// Pantallas sin sesión: header público con idioma y el contenido centrado.
export default async function AuthLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <BackgroundWaves />
      <PortalHeader variant="public" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
        {children}
      </main>
    </div>
  );
}
