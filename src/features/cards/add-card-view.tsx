"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorNote, PageHeader, primaryButton, QueryState, Card } from "@/features/portal/ui";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { useStepUp } from "@/features/security/security-check";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { CardForm } from "./card-form";
import { type CardDraft, emptyDraft, toNewCard, validateDraft } from "./card-validation";
import { CARD_QUERIES } from "./my-cards";

// Add a card: formulario con escaneo; guarda en el Soft y vuelve a Payments con el aviso.
export function AddCardView() {
  const t = useTranslations("Cards");
  const cards = usePortalQuery("cards", () => api.GET("/cards"));

  return (
    <div className="flex max-w-xl flex-col gap-4 lg:gap-6">
      <PageHeader title={t("addTitle")} subtitle={t("addSubtitle")} />
      <QueryState loading={cards.isPending} error={cards.isError} onRetry={() => void cards.refetch()} />
      {cards.data && <AddCardForm setDefault={!cards.data.some((card) => !card.expired)} />}
    </div>
  );
}

// La casilla del cobro automático sale marcada cuando no hay otra tarjeta activa.
function AddCardForm({ setDefault }: { setDefault: boolean }) {
  const t = useTranslations("Cards");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { run, sheet } = useStepUp();
  const [draft, setDraft] = useState<CardDraft>(() => emptyDraft(setDefault));
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const save = async (): Promise<"step_up" | void> => {
    setBusy(true);
    setFailed(null);
    try {
      const { error, response } = await api.POST("/cards", { body: toNewCard(draft) });
      const body = error as { code?: string; message?: string } | undefined;
      if (response.status === 403 && body?.code === "step_up_required") return "step_up";
      if (!response.ok) return setFailed(body?.message ?? t("saveError"));
      await Promise.all(CARD_QUERIES.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      router.push("/payments?saved=1");
    } catch {
      setFailed(t("saveError"));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    setShowErrors(true);
    if (Object.keys(validateDraft(draft)).length > 0) return;
    void run(save);
  };

  return (
    <Card className="gap-5">
      <CardForm draft={draft} onChange={setDraft} showErrors={showErrors} defaultLabel="useForMonthly" />
      {failed && <ErrorNote>{failed}</ErrorNote>}
      <button type="button" disabled={busy} onClick={submit} className={primaryButton}>
        {busy ? t("saving") : t("save")}
      </button>
      {sheet}
    </Card>
  );
}
