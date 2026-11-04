"use client";

import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { InlineMessage } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader, QueryState } from "@/components/ui/feedback";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { api } from "@/lib/api/client";
import type { PaymentItem, Receipt } from "@/lib/api/types";
import { formatDate, formatMoney } from "@/lib/format";
import { PayNowButton } from "@/features/pay/pay-view";
import { paymentConcept, receiptAvailable, STATUS_TONES } from "./history";
import { ReceiptDialog } from "./receipt-dialog";
import { MyCards } from "@/features/cards/my-cards";

// Payments: totales del plan e historial de Transaction Records con su recibo.
export function PaymentsView() {
  const t = useTranslations("Payments");
  const query = usePortalQuery("payments", () => api.GET("/payments"));
  const payments = query.data;
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const pay = usePortalQuery("pay", () => api.GET("/pay"));

  const subtitle = payments?.plan_name
    ? t("subtitle", { plan: payments.plan_name, amount: formatMoney(payments.monthly_amount) })
    : undefined;
  const tiles = payments
    ? [
        { key: "planTotal", short: "planTotalShort", value: payments.plan_total, color: "text-navy" },
        { key: "paid", short: "paid", value: payments.paid, color: "text-success" },
        { key: "remaining", short: "remaining", value: payments.remaining, color: "text-navy" },
      ] as const
    : [];

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        title={t("title")}
        subtitle={subtitle}
        action={
          pay.data?.payable ? (
            <PayNowButton size="md" className="hidden lg:flex">{t("payNow")}</PayNowButton>
          ) : undefined
        }
      />
      <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
      {payments && (
        <div className="flex flex-col gap-4 lg:gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
            <div className="grid grid-cols-3 gap-2 lg:gap-5">
              {tiles.map((tile) => (
                <div key={tile.key} className="flex flex-col items-center gap-1 rounded-[14px] bg-card px-2 py-3 text-center shadow-card lg:items-start lg:gap-1.5 lg:rounded-2xl lg:px-6 lg:py-5 lg:text-left">
                  <span className="text-[10px] font-extrabold tracking-[.04em] whitespace-nowrap text-ink-muted uppercase lg:text-xs lg:tracking-[.06em]">
                    <span className="lg:hidden">{t(tile.short)}</span>
                    <span className="hidden lg:inline">{t(tile.key)}</span>
                  </span>
                  <span className={`text-[19px] leading-none font-extrabold lg:text-[30px] ${tile.color}`}>
                    {formatMoney(tile.value)}
                  </span>
                </div>
              ))}
            </div>
            {pay.data?.payable && (
              <PayNowButton size="md" block className="lg:hidden">{t("payNow")}</PayNowButton>
            )}
            <div id="my-cards" className="xl:hidden">
              <MyCards />
            </div>
            <History items={payments.history} onReceipt={setReceipt} />
          </div>
          <aside className="hidden xl:block">
            <MyCards layout="column" />
          </aside>
        </div>
      )}
      <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
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
      status: <Badge tone={STATUS_TONES[item.status]}>{t(`statuses.${item.status}`)}</Badge>,
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
      <DataTable
        fit
        className="hidden lg:flex"
        template="1.1fr 1.4fr .8fr .9fr .9fr 118px"
        rows={items}
        rowKey={(item, i) => `${item.receipt_id ?? item.date}-${i}`}
        columns={[
          { key: "date", header: t("date"), cell: (item) => <span className="font-extrabold whitespace-nowrap">{formatDate(item.date, locale)}</span> },
          {
            key: "type",
            header: t("type"),
            className: "flex flex-col font-semibold text-body",
            cell: (item) => {
              const d = describe(item);
              return (
                <>
                  <span className="truncate">{d.type}</span>
                  {d.detail && <span className="truncate text-xs text-ink-muted">{d.detail}</span>}
                </>
              );
            },
          },
          { key: "amount", header: t("amount"), className: "font-extrabold", cell: (item) => formatMoney(item.amount) },
          { key: "method", header: t("method"), className: "font-semibold whitespace-nowrap text-body", cell: (item) => (item.card_last4 ? `•••• ${item.card_last4}` : describe(item).method) },
          { key: "status", header: t("status"), cell: (item) => describe(item).status },
          { key: "receipt", header: "", className: "flex justify-end", cell: (item) => receiptAvailable(item) && <ReceiptButton item={item} onReceipt={onReceipt} variant="button" /> },
        ]}
      />
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
      <Button variant={variant === "button" ? "outline" : "link"} size="sm" onClick={() => void open()} disabled={busy}>
        <Download className="size-4" strokeWidth={2.5} aria-hidden />
        {variant === "button" ? t("receipt") : t("downloadReceipt")}
      </Button>
      {failed && <InlineMessage>{t("receiptError")}</InlineMessage>}
    </div>
  );
}
