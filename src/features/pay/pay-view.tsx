"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert, CircleCheck, Download, Lock, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { BrandBadge } from "@/features/cards/brand-badge";
import { CardForm } from "@/features/cards/card-form";
import { type CardDraft, cardLabel, emptyDraft, toNewCard, validateDraft } from "@/features/cards/card-validation";
import { CARD_QUERIES } from "@/features/cards/my-cards";
import { ReceiptDialog } from "@/features/payments/receipt-dialog";
import { Card, CardLabel, Chip, ErrorNote, outlineButton, PageHeader, primaryButton, QueryState } from "@/features/portal/ui";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { useStepUp } from "@/features/security/security-check";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { PaymentResult, PayNow, Receipt } from "@/lib/api/types";
import { formatDate, formatMoney, formatTimeOfDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { expiredDefault, initialCardId, payBreakdown, screenFor, usableCards } from "./pay-logic";

const NEW_CARD = "new";

// Pay now: monto fijo, tarjeta guardada o nueva, y resultado del cobro.
export function PayView() {
  const t = useTranslations("Pay");
  const query = usePortalQuery("pay", () => api.GET("/pay"));
  const [result, setResult] = useState<PaymentResult | null>(null);

  return (
    <div className="flex max-w-xl flex-col gap-4 lg:gap-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
      {query.data &&
        (screenFor(result) === "approved" && result ? (
          <Approved result={result} />
        ) : (
          <Review pay={query.data} declined={result !== null} onResult={setResult} onRetry={() => setResult(null)} />
        ))}
    </div>
  );
}

function Review({ pay, declined, onResult, onRetry }: { pay: PayNow; declined: boolean; onResult: (r: PaymentResult) => void; onRetry: () => void }) {
  const t = useTranslations("Pay");
  const queryClient = useQueryClient();
  const usable = usableCards(pay.cards);
  const [selected, setSelected] = useState<number | typeof NEW_CARD | null>(() => initialCardId(pay) ?? (usable.length === 0 ? NEW_CARD : null));
  const [draft, setDraft] = useState<CardDraft>(() => emptyDraft(usable.length === 0));
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());
  const { run, sheet } = useStepUp();
  const expired = expiredDefault(pay.cards);
  const breakdown = payBreakdown(pay);

  // Un intento nuevo (otra tarjeta tras un rechazo) lleva otra clave.
  useEffect(() => {
    if (!declined) idempotencyKey.current = crypto.randomUUID();
  }, [declined]);

  if (!pay.payable) {
    return (
      <Card className="items-center text-center">
        <p className="font-bold">{t("nothingDue")}</p>
        <Link href="/payments" className={cn(outlineButton, "min-h-12 text-[15px]")}>
          {t("back")}
        </Link>
      </Card>
    );
  }

  const charge = async (): Promise<"step_up" | void> => {
    setBusy(true);
    setError(null);
    try {
      const body =
        selected === NEW_CARD
          ? { idempotency_key: idempotencyKey.current, new_card: toNewCard(draft) }
          : { idempotency_key: idempotencyKey.current, card_id: selected as number };
      const { data, error: failure, response } = await api.POST("/pay", { body });
      const code = (failure as { code?: string } | undefined)?.code;
      if (response.status === 403 && code === "step_up_required") return "step_up";
      if (data) {
        idempotencyKey.current = crypto.randomUUID();
        await Promise.all(CARD_QUERIES.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
        return onResult(data);
      }
      idempotencyKey.current = crypto.randomUUID();
      setError(code === "nothing_due" ? t("nothingDue") : code === "in_progress" ? t("inProgress") : t("error"));
    } catch {
      setError(t("error"));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (selected === NEW_CARD) {
      setShowErrors(true);
      if (Object.keys(validateDraft(draft)).length > 0) return;
    }
    if (selected === null) return;
    void run(charge);
  };

  return (
    <>
      <Card className="gap-1.5">
        <CardLabel>{t("amountDue")}</CardLabel>
        <span className="text-[34px] leading-tight font-extrabold">{formatMoney(pay.amount)}</span>
        {breakdown && <span className="text-sm font-semibold text-ink-muted">{breakdown}</span>}
      </Card>

      {expired && usable.length > 0 && <Notice>{t("defaultExpired", { card: cardLabel(expired) })}</Notice>}
      {usable.length === 0 && <Notice>{expired ? t("noCard", { card: cardLabel(expired) }) : t("noCardAtAll")}</Notice>}

      <Card className="gap-3">
        <CardLabel>{t("payWith")}</CardLabel>
        <div role="radiogroup" className="flex flex-col gap-2.5">
          {usable.map((card) => (
            <Option key={card.id} checked={selected === card.id} onSelect={() => setSelected(card.id)}>
              <BrandBadge brand={card.brand} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-extrabold">{cardLabel(card)}</span>
                <span className="text-[13px] font-semibold text-ink-muted">{t("expires", { expiration: card.expiration })}</span>
              </span>
              {card.is_default && <Chip fg="#C2410C" bg="#FEF0E7">{t("monthlyChip")}</Chip>}
            </Option>
          ))}
          <Option checked={selected === NEW_CARD} onSelect={() => setSelected(NEW_CARD)}>
            <span className="flex h-7 w-11 items-center justify-center rounded-md border-[1.5px] border-dashed border-line-strong text-ink-muted">
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="text-[15px] font-extrabold">{t("useNewCard")}</span>
          </Option>
        </div>
        {selected === NEW_CARD && (
          <div className="pt-2">
            <CardForm draft={draft} onChange={setDraft} showErrors={showErrors} defaultLabel="saveForMonthly" />
          </div>
        )}
      </Card>

      {declined && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3.5 text-sm leading-snug font-semibold text-[#991b1b]">
          <span className="flex items-start gap-2.5">
            <CircleAlert className="mt-px size-[18px] shrink-0 text-danger" strokeWidth={2.25} aria-hidden />
            {t("declined")}
          </span>
          <button
            type="button"
            onClick={() => {
              onRetry();
              setSelected(usable.find((card) => card.id !== selected)?.id ?? NEW_CARD);
            }}
            className={cn(outlineButton, "min-h-11 border-danger text-[15px] text-danger")}
          >
            {t("tryAnother")}
          </button>
        </div>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}

      <button type="button" disabled={busy || selected === null || declined} onClick={submit} className={primaryButton}>
        {busy ? t("processing") : t("pay", { amount: formatMoney(pay.amount) })}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-ink-muted">
        <Lock className="size-3.5" strokeWidth={2.5} aria-hidden />
        {t("secure")}
      </p>
      {sheet}
    </>
  );
}

function Option({ checked, onSelect, children }: { checked: boolean; onSelect: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-3 text-left",
        checked ? "border-brand bg-[#fffbf8]" : "border-line bg-card hover:border-line-strong",
      )}
    >
      <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2", checked ? "border-brand" : "border-line-strong")}>
        {checked && <span className="size-2.5 rounded-full bg-brand" />}
      </span>
      {children}
    </button>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-3.5 py-3 text-sm leading-snug font-semibold text-[#92400e]">
      <CircleAlert className="mt-px size-[18px] shrink-0 text-[#d97706]" strokeWidth={2.25} aria-hidden />
      <span>{children}</span>
    </div>
  );
}

// Fecha local YYYY-MM-DD del momento del cobro.
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function Approved({ result }: { result: PaymentResult }) {
  const t = useTranslations("Pay");
  const locale = useLocale();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [failed, setFailed] = useState(false);
  const paidAt = result.paid_at ? new Date(result.paid_at) : new Date();

  const openReceipt = async () => {
    if (!result.transaction_id) return;
    setFailed(false);
    try {
      const { data } = await api.POST("/payments/{transactionId}/receipt", { params: { path: { transactionId: result.transaction_id } } });
      if (data) setReceipt(data);
      else setFailed(true);
    } catch {
      setFailed(true);
    }
  };

  return (
    <Card className="items-center gap-4 py-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-range-good-bg text-range-good">
        <CircleCheck className="size-9" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-lg font-extrabold">{t("approved")}</span>
        <span className="text-[34px] leading-tight font-extrabold">{formatMoney(result.amount)}</span>
        <span className="text-sm font-semibold text-ink-muted">
          {t("approvedMeta", { date: formatDate(localDay(paidAt), locale), time: formatTimeOfDay(paidAt, locale) })}
        </span>
        {result.card && <span className="text-sm font-semibold text-ink-muted">{cardLabel(result.card)}</span>}
      </div>
      {result.transaction_id && (
        <button type="button" onClick={() => void openReceipt()} className={cn(outlineButton, "min-h-12 text-[15px]")}>
          <Download className="size-[18px]" strokeWidth={2.25} aria-hidden />
          {t("downloadReceipt")}
        </button>
      )}
      {failed && <ErrorNote>{t("error")}</ErrorNote>}
      <Link href="/" className={primaryButton}>
        {t("backHome")}
      </Link>
      <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
    </Card>
  );
}
