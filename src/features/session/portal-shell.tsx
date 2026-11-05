"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useEffect, useMemo, type ReactNode } from "react";
import { NoAccess } from "@/features/auth/no-access";
import { BottomNav } from "@/components/shell/bottom-nav";
import { PortalHeader } from "@/components/shell/portal-header";
import { SideNav } from "@/components/shell/side-nav";
import { useLocaleSwitch } from "@/i18n/client-locale";
import { usePathname, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { PortalSessionInfo } from "@/lib/api/types";
import { SessionContext, type SessionActions } from "./session-context";
import { LANGUAGE_SYNCED, leavePortal } from "./leave-portal";
import { PayProvider } from "@/features/pay/pay-view";
import { fetchSession, SESSION_KEY, type SessionState } from "./session-query";

// Protege las páginas con sesión: sin sesión va al login, sin acceso muestra la pantalla de reactivación.
export function PortalShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const localeSwitch = useLocaleSwitch();
  const { data: state } = useQuery({ queryKey: SESSION_KEY, queryFn: fetchSession, refetchOnWindowFocus: "always" });

  // Cada cambio de sección vuelve a validar la sesión, así un acceso apagado o una sesión cerrada sacan al cliente.
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: SESSION_KEY });
  }, [pathname, queryClient]);

  useEffect(() => {
    if (state?.kind === "signed_out") leavePortal(locale, state.reason);
  }, [state, locale]);

  // Una página restaurada con Atrás tras cerrar sesión se recarga para volver a validar la sesión.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      document.documentElement.style.visibility = "hidden";
      window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // El idioma del cliente (leads.language) se aplica una vez por visita; después manda el switch EN/ES de la pestaña.
  useEffect(() => {
    if (state?.kind !== "active" || sessionStorage.getItem(LANGUAGE_SYNCED) === state.session.account.id) return;
    sessionStorage.setItem(LANGUAGE_SYNCED, state.session.account.id);
    const saved = state.session.language;
    if (saved && saved !== locale) localeSwitch?.setLocale(saved);
  }, [state, locale, localeSwitch]);

  const actions = useMemo<SessionActions | null>(() => {
    if (state?.kind !== "active") return null;

    const replaceSession = (session: PortalSessionInfo) => {
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== SESSION_KEY[0] });
      const next: SessionState = { kind: "active", session };
      queryClient.setQueryData(SESSION_KEY, next);
    };

    return {
      session: state.session,
      signOut: () => {
        void api.POST("/session/logout").finally(() => leavePortal(locale));
      },
      switchClient: () => router.push("/switch-account"),
      switchAccount: (accountId) => {
        void api.POST("/session/switch-account", { body: { account_id: accountId } }).then(({ data }) => {
          if (data) replaceSession(data);
        });
      },
    };
  }, [state, queryClient, router, locale]);

  if (state?.kind === "no_access") {
    return (
      <Frame header={<PortalHeader variant="public" />}>
        <NoAccess reactivation={state.reactivation} />
      </Frame>
    );
  }

  if (!actions) return <Frame header={<PortalHeader variant="portal" user={null} />} />;

  const { session } = actions;
  return (
    <SessionContext.Provider value={actions}>
      <Frame
        header={
          <PortalHeader
            variant="portal"
            user={{
              name: session.client.full_name,
              initials: session.client.initials,
              account: session.account.number,
              sharedPhone: session.shared_phone,
            }}
          />
        }
        withNav
      >
        <PayProvider>{children}</PayProvider>
      </Frame>
    </SessionContext.Provider>
  );
}

function Frame({ header, withNav, children }: { header: ReactNode; withNav?: boolean; children?: ReactNode }) {
  if (!withNav) {
    return (
      <>
        {header}
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">{children}</main>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-6 px-4 pt-5 pb-28 lg:grid-cols-[240px_minmax(0,1fr)] lg:pt-6 lg:pb-10">
        <aside className="hidden lg:block">
          <SideNav />
        </aside>
        <main className="flex min-w-0 flex-col gap-6">{children}</main>
      </div>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}
