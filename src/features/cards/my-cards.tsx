"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { InlineMessage } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel, Panel } from "@/components/ui/card";
import { QueryState, Toast } from "@/components/ui/feedback";
import { Sheet } from "@/components/ui/modal";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { useStepUp } from "@/features/security/security-check";
import { api } from "@/lib/api/client";
import type { Card as SavedCard } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { useFitViewport } from "@/lib/use-fit-viewport";
import { cn } from "@/lib/utils";
import { AddCardDialog } from "./add-card-dialog";
import { BrandBadge } from "./brand-badge";
import { cardLabel } from "./card-validation";

export const CARD_QUERIES = ["cards", "pay", "home", "payments"];

// My cards: tarjetas activas, chips de estado, alta en modal y cambio de la tarjeta del cobro automático.
// layout="column": la columna derecha de Payments en escritorio, con cada tarjeta en su recuadro y Add card abajo.
export function MyCards({ layout = "list" }: { layout?: "list" | "column" }) {
  const t = useTranslations("Cards");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const query = usePortalQuery("cards", () => api.GET("/cards"));
  const home = usePortalQuery("home", () => api.GET("/home"));
  const { run, sheet } = useStepUp();
  const [confirming, setConfirming] = useState<SavedCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<"changed" | "saved" | null>(null);
  const [adding, setAdding] = useState(false);
  const nextDate = home.data?.payments.state === "current" ? home.data.payments.next_date : null;
  const { ref: fitRef, style: fitStyle } = useFitViewport<HTMLDivElement>(1280);

  const setDefault = async (card: SavedCard): Promise<"step_up" | void> => {
    setBusy(true);
    setFailed(false);
    try {
      const { error, response } = await api.POST("/cards/{id}/default", { params: { path: { id: card.id } } });
      if (response.status === 403 && (error as { code?: string } | undefined)?.code === "step_up_required") return "step_up";
      if (!response.ok) return setFailed(true);
      setConfirming(null);
      setToast("changed");
      await Promise.all(CARD_QUERIES.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const chips = (card: SavedCard) => (
    <>
      {card.is_default && <Badge tone="brand">{t("monthlyChip")}</Badge>}
      {card.expired ? <Badge tone="danger">{t("expired")}</Badge> : card.expires_soon && <Badge tone="warning">{t("expiresSoon")}</Badge>}
    </>
  );
  const canSetDefault = (card: SavedCard) => !card.is_default && !card.expired;

  const dialogs = (
    <>
    <Sheet open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)} title={t("confirmTitle", { last4: confirming?.last4 ?? "" })} description={nextDate ? t("confirmText", { date: formatDate(nextDate, locale) }) : t("confirmTextNoDate")}>
      {failed && <InlineMessage>{t("changeError")}</InlineMessage>}
      <Button block disabled={busy} onClick={() => confirming && void run(() => setDefault(confirming))}>
        {t("confirm")}
      </Button>
      <Button variant="ghost" size="md" block onClick={() => setConfirming(null)}>
        {t("cancel")}
      </Button>
    </Sheet>
    <AddCardDialog
      open={adding}
      setDefault={!query.data?.some((card) => !card.expired)}
      onClose={() => setAdding(false)}
      onSaved={() => {
        setAdding(false);
        setToast("saved");
      }}
    />
    {sheet}
    <Toast message={toast && t(toast)} onDone={() => setToast(null)} />
    </>
  );

  if (layout === "column") {
    return (
      <div ref={fitRef} style={fitStyle} className="flex min-h-0 flex-col">
        <Card className="min-h-0 gap-3 px-6 py-5">
          <CardLabel>{t("title")}</CardLabel>
          <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
          {query.data?.length === 0 && <p className="text-sm font-semibold text-ink-muted">{t("empty")}</p>}
          <div className="-mx-1 flex min-h-0 flex-col gap-3 overflow-y-auto px-1 py-0.5">
            {query.data?.map((card) => (
              <Panel key={card.id} className={cn(card.expired && "opacity-60")}>
                <div className="flex items-center gap-2.5">
                  <BrandBadge brand={card.brand} />
                  <span className="text-[15px] font-extrabold whitespace-nowrap">{cardLabel(card)}</span>
                </div>
                <span className="text-[13px] font-semibold text-ink-muted">{t("expires", { expiration: card.expiration })}</span>
                {(card.is_default || card.expired || card.expires_soon || canSetDefault(card)) && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex gap-1.5">{chips(card)}</span>
                    {canSetDefault(card) && (
                      <Button variant="link" size="inline" className="text-sm" onClick={() => setConfirming(card)}>
                        {t("setDefault")}
                      </Button>
                    )}
                  </div>
                )}
              </Panel>
            ))}
          </div>
          <Button size="md" block onClick={() => setAdding(true)}>
            <Plus className="size-[18px]" strokeWidth={2.75} aria-hidden />
            {t("addCard")}
          </Button>
        </Card>
        {dialogs}
      </div>
    );
  }

  return (
    <Card className="gap-0 px-5 py-4 lg:px-6">
      <div className="flex items-center justify-between gap-2 pb-2">
        <CardLabel>{t("title")}</CardLabel>
        <Button variant="brand" size="xs" className="px-3" onClick={() => setAdding(true)}>
          <Plus className="size-4" strokeWidth={2.75} aria-hidden />
          {t("addCard")}
        </Button>
      </div>
      <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
      {query.data?.length === 0 && <p className="py-3 text-sm font-semibold text-ink-muted">{t("empty")}</p>}
      {query.data?.map((card) => (
        <div key={card.id} className={cn("flex items-center gap-3 border-t border-line-soft py-3.5 first-of-type:border-t-0", card.expired && "opacity-60")}>
          <BrandBadge brand={card.brand} />
          <div className="flex min-w-0 flex-1 flex-col gap-1 lg:flex-row lg:items-center lg:gap-4">
            <span className="text-[15px] font-extrabold">{cardLabel(card)}</span>
            <span className="text-[13px] font-semibold text-ink-muted">{t("expires", { expiration: card.expiration })}</span>
            <span className="flex gap-1.5">
              {chips(card)}
            </span>
          </div>
          {canSetDefault(card) && (
            <Button variant="outline" size="xs" onClick={() => setConfirming(card)}>
              {t("setDefault")}
            </Button>
          )}
        </div>
      ))}
      {dialogs}
    </Card>
  );
}
