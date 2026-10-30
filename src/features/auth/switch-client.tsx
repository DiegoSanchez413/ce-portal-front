"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SESSION_KEY, type SessionState } from "@/features/session/session-query";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { Reactivation } from "@/lib/api/types";
import { NoAccess } from "./no-access";
import { SelectClientStep } from "./select-client-step";

// Switch account en un celular compartido: elige otro cliente sin pedir un código nuevo.
export function SwitchClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [noAccess, setNoAccess] = useState<Reactivation | undefined | null>(null);

  const { data: clients } = useQuery({
    queryKey: ["session-clients"],
    queryFn: async () => {
      const { data, response } = await api.GET("/session/clients");
      if (response.status === 401) router.replace("/login");
      return data ?? [];
    },
  });

  const select = async (leadId: number) => {
    setBusy(true);
    try {
      const { data, error, response } = await api.POST("/session/switch-client", { body: { lead_id: leadId } });
      if (data) {
        queryClient.clear();
        const next: SessionState = { kind: "active", session: data };
        queryClient.setQueryData(SESSION_KEY, next);
        router.replace("/");
        return;
      }
      if (response.status === 403 && error && "reactivation" in error) return setNoAccess(error.reactivation);
      if (response.status === 401) router.replace("/login");
    } finally {
      setBusy(false);
    }
  };

  const useDifferentNumber = () => {
    void api.POST("/session/logout").finally(() => {
      queryClient.clear();
      router.replace("/login");
    });
  };

  if (noAccess !== null) return <NoAccess reactivation={noAccess} />;
  if (!clients) return null;

  return (
    <SelectClientStep
      clients={clients}
      busy={busy}
      onSelect={(leadId) => void select(leadId)}
      onUseDifferentNumber={useDifferentNumber}
    />
  );
}
