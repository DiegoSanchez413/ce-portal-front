"use client";

import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Card, CardLabel, Chip, ErrorNote, PageHeader, QueryState, smallOutlineButton } from "@/features/portal/ui";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { api } from "@/lib/api/client";
import type { PaymentItem, Receipt } from "@/lib/api/types";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paymentConcept, receiptAvailable, STATUS_STYLES } from "./history";
import { ReceiptDialog } from "./receipt-dialog";
import { MyCards } from "@/features/cards/my-cards";
import { primaryButton, Toast } from "@/features/portal/ui";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

// Payments: totales del plan e historial de Transaction Records con su recibo.
export function PaymentsView() {
  const t = useTranslations("Payments");
  const query = usePortalQuery("payments", () => api.GET("/payments"));
  const payments = query.data;
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const pay = usePortalQuery("pay", () => api.GET("/pay"));
  const cardsT = useTranslations("Cards");
  const saved = useSearchParams().get("saved") === "1";
  const [toast, setToast] = useState<string | null>(() => (saved ? cardsT("saved") : null));

  const subtitle = payments?.plan_name
    ? t("subtitle", { plan: payments.plan_name, amount: formatMoney(payments.monthly_amount) })
    : undefined;
  const tiles = payments
    ? [
        { key: "planTotal", short: "planTotalShort", value: payments.plan_total, color: "#1F2A44" },
        { key: "paid", short: "paid", value: payments.paid, color: "#15803D" },
        { key: "remaining", short: "remaining", value: payments.remaining, color: "#1F2A44" },
      ] as const
    : [];

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        title={t("title")}
        subtitle={subtitle}
        action={
          pay.data?.payable ? (
            <Link href="/payments/pay" className={cn(primaryButton, "hidden min-h-12 w-auto px-7 text-[15px] lg:flex")}>
              {t("payNow")}
            </Link>
          ) : undefined
        }
      />
      <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
      {payments && (
        <>
          <div className="grid grid-cols-3 gap-2 lg:gap-5">
            {tiles.map((tile) => (
              <div key={tile.key} className="flex flex-col items-center gap-1 rounded-[14px] bg-card px-2 py-3 text-center shadow-[0_4px_20px_rgba(31,42,68,.06)] lg:items-start lg:gap-1.5 lg:rounded-2xl lg:px-6 lg:py-5 lg:text-left">
                <span className="text-[10px] font-extrabold tracking-[.04em] whitespace-nowrap text-ink-muted uppercase lg:text-xs lg:tracking-[.06em]">
                  <span className="lg:hidden">{t(tile.short)}</span>
                  <span className="hidden lg:inline">{t(tile.key)}</span>
                </span>
                <span className="text-[19px] leading-none font-extrabold lg:text-[30px]" style={{ color: tile.color }}>
                  {formatMoney(tile.value)}
                </span>
              </div>
            ))}
          </div>
          {pay.data?.payable && (
            <Link href="/payments/pay" className={cn(primaryButton, "min-h-12 text-[15px] lg:hidden")}>
              {t("payNow")}
            </Link>
          )}
          <div id="my-cards" className="lg:order-last">
            <MyCards />
          </div>
          <History items={payments.history} onReceipt={setReceipt} />
        </>
      )}
      <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function History({ items, onReceipt }: { items: PaymentItem[]; onReceipt: (receipt: Receipt) => void }) {
  const t = useTranslations("Payments");
  const locale = useLocale();

  if (items.length === 0) {
    return (
      <Card className="items-center text-center">
        <p className="font-bold text-ink-muted">{t("empty")}</p>
      </Card>
    );
  }

  const describe = (item: PaymentItem) => {
    const concept = paymentConcept(item);
    return {
      type: concept.key === "yearly_total" ? t("concepts.yearly_total", { year: concept.detail ?? "" }) : concept.key ? t(`concepts.${concept.key}`) : (concept.detail ?? ""),
      detail: concept.key === "charge" ? concept.detail : null,
      method: item.card_last4 ? t("card", { last4: item.card_last4 }) : item.method && item.method !== "card" ? t(`methods.${item.method}`) : "—",
      status: <Chip fg={STATUS_STYLES[item.status].fg} bg={STATUS_STYLES[item.status].bg}>{t(`statuses.${item.status}`)}</Chip>,
    };
  };

  return (
    <>
      <div className="flex flex-col gap-4 lg:hidden">
        <CardLabel className="px-1 pt-1.5">{t("history")}</CardLabel>
        {items.map((item, i) => {
          const d = describe(item);
          return (
            <Card key={`${item.receipt_id ?? item.date}-${i}`} className="gap-2.5 px-[18px] py-4">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[15px] font-extrabold">{d.type}</span>
                  {d.detail && <span className="truncate text-xs font-semibold text-ink-muted">{d.detail}</span>}
                  <span className="text-[13px] font-semibold text-ink-muted">
                    {formatDate(item.date, locale)} · {d.method}
                  </span>
                </div>
                <span className="text-lg font-extrabold">{formatMoney(item.amount)}</span>
              </div>
              <div className="flex items-center justify-between gap-2.5">
                {d.status}
                {receiptAvailable(item) && <ReceiptButton item={item} onReceipt={onReceipt} variant="link" />}
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="hidden gap-0 px-6 py-2 lg:flex">
        <div className="grid grid-cols-[1fr_1.3fr_.8fr_1.1fr_.9fr_190px] gap-4 border-b border-line-soft py-3.5 text-[11px] font-extrabold tracking-[.06em] text-[#9CA3AF] uppercase">
          <span>{t("date")}</span>
          <span>{t("type")}</span>
          <span>{t("amount")}</span>
          <span>{t("method")}</span>
          <span>{t("status")}</span>
          <span />
        </div>
        {items.map((item, i) => {
          const d = describe(item);
          return (
            <div key={`${item.receipt_id ?? item.date}-${i}`} className="grid grid-cols-[1fr_1.3fr_.8fr_1.1fr_.9fr_190px] items-center gap-4 border-b border-line-soft py-3 text-[15px] last:border-b-0">
              <span className="font-extrabold">{formatDate(item.date, locale)}</span>
              <span className="flex min-w-0 flex-col font-semibold text-[#4b5563]">
                {d.type}
                {d.detail && <span className="truncate text-xs text-ink-muted">{d.detail}</span>}
              </span>
              <span className="font-extrabold">{formatMoney(item.amount)}</span>
              <span className="font-semibold text-[#4b5563]">{d.method}</span>
              <span>{d.status}</span>
              <span className="flex justify-end">{receiptAvailable(item) && <ReceiptButton item={item} onReceipt={onReceipt} variant="button" />}</span>
            </div>
          );
        })}
      </Card>
    </>
  );
}

// Pide los datos del recibo (registra la descarga) y abre el modal.
function ReceiptButton({ item, onReceipt, variant }: { item: PaymentItem; onReceipt: (receipt: Receipt) => void; variant: "link" | "button" }) {
  const t = useTranslations("Payments");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const open = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const { data } = await api.POST("/payments/{transactionId}/receipt", { params: { path: { transactionId: item.receipt_id ?? "" } } });
      if (data) onReceipt(data);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void open()}
        disabled={busy}
        className={cn(
          variant === "button"
            ? smallOutlineButton
            : "flex min-h-11 items-center gap-1.5 px-2 text-sm font-extrabold text-brand hover:text-[#db5a15] disabled:opacity-45",
        )}
      >
        <Download className="size-4" strokeWidth={2.5} aria-hidden />
        {t("downloadReceipt")}
      </button>
      {failed && <ErrorNote>{t("receiptError")}</ErrorNote>}
    </div>
  );
}
