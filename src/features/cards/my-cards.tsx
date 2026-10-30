"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Card, CardLabel, Chip, ErrorNote, ghostButton, primaryButton, QueryState, Sheet, smallOutlineButton, Toast } from "@/features/portal/ui";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { useStepUp } from "@/features/security/security-check";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { Card as SavedCard } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BrandBadge } from "./brand-badge";
import { cardLabel } from "./card-validation";

export const CARD_QUERIES = ["cards", "pay", "home", "payments"];

// My cards: tarjetas activas, chips de estado y cambio de la tarjeta del cobro automático.
export function MyCards() {
  const t = useTranslations("Cards");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const query = usePortalQuery("cards", () => api.GET("/cards"));
  const home = usePortalQuery("home", () => api.GET("/home"));
  const { run, sheet } = useStepUp();
  const [confirming, setConfirming] = useState<SavedCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const nextDate = home.data?.payments.state === "current" ? home.data.payments.next_date : null;

  const setDefault = async (card: SavedCard): Promise<"step_up" | void> => {
    setBusy(true);
    setFailed(false);
    try {
      const { error, response } = await api.POST("/cards/{id}/default", { params: { path: { id: card.id } } });
      if (response.status === 403 && (error as { code?: string } | undefined)?.code === "step_up_required") return "step_up";
      if (!response.ok) return setFailed(true);
      setConfirming(null);
      setToast(t("changed"));
      await Promise.all(CARD_QUERIES.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="gap-0 px-5 py-4 lg:px-6">
      <div className="flex items-center justify-between gap-2 pb-2">
        <CardLabel>{t("title")}</CardLabel>
        <Link href="/payments/add-card" className={cn(smallOutlineButton, "min-h-10 border-brand px-3 text-brand")}>
          <Plus className="size-4" strokeWidth={2.75} aria-hidden />
          {t("addCard")}
        </Link>
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
              {card.is_default && <Chip fg="#C2410C" bg="#FEF0E7">{t("monthlyChip")}</Chip>}
              {card.expired ? (
                <Chip fg="#B91C1C" bg="#FEE2E2">{t("expired")}</Chip>
              ) : (
                card.expires_soon && <Chip fg="#B45309" bg="#FEF3C7">{t("expiresSoon")}</Chip>
              )}
            </span>
          </div>
          {!card.is_default && !card.expired && (
            <button type="button" onClick={() => setConfirming(card)} className={cn(smallOutlineButton, "min-h-10 px-3.5")}>
              {t("setDefault")}
            </button>
          )}
        </div>
      ))}
      <Sheet open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)} title={t("confirmTitle", { last4: confirming?.last4 ?? "" })} description={nextDate ? t("confirmText", { date: formatDate(nextDate, locale) }) : t("confirmTextNoDate")}>
        {failed && <ErrorNote>{t("changeError")}</ErrorNote>}
        <button type="button" disabled={busy} onClick={() => confirming && void run(() => setDefault(confirming))} className={primaryButton}>
          {t("confirm")}
        </button>
        <button type="button" onClick={() => setConfirming(null)} className={ghostButton}>
          {t("cancel")}
        </button>
      </Sheet>
      {sheet}
      <Toast message={toast} onDone={() => setToast(null)} />
    </Card>
  );
}
