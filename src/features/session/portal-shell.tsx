"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { NoAccess } from "@/features/auth/no-access";
import { BottomNav } from "@/components/shell/bottom-nav";
import { PortalHeader } from "@/components/shell/portal-header";
import { SideNav } from "@/components/shell/side-nav";
import { usePathname, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { PortalSessionInfo } from "@/lib/api/types";
import { SessionContext, type SessionActions } from "./session-context";
import { leavePortal } from "./leave-portal";
import { fetchSession, SESSION_KEY, type SessionState } from "./session-query";

// Protege las páginas con sesión: sin sesión va al login, sin acceso muestra la pantalla de reactivación.
export function PortalShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const languageSynced = useRef(false);
  const { data: state } = useQuery({ queryKey: SESSION_KEY, queryFn: fetchSession });

  useEffect(() => {
    if (state?.kind === "signed_out") leavePortal(locale);
  }, [state, locale]);

  useEffect(() => {
    if (state?.kind !== "active" || languageSynced.current) return;
    languageSynced.current = true;
    const saved = state.session.language;
    if (saved && saved !== locale) router.replace(pathname, { locale: saved });
  }, [state, locale, pathname, router]);

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
      saveLanguage: (language) => {
        void api.POST("/session/language", { body: { language } }).catch(() => undefined);
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
        {children}
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
