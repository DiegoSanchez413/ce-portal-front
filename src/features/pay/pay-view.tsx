"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Download, LoaderCircle, Lock, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { BrandBadge } from "@/features/cards/brand-badge";
import { MissingNote } from "@/features/cards/add-card-dialog";
import { CardForm } from "@/features/cards/card-form";
import { type CardDraft, cardLabel, emptyDraft, toNewCard, validateDraft } from "@/features/cards/card-validation";
import { CARD_QUERIES } from "@/features/cards/my-cards";
import { ReceiptDialog } from "@/features/payments/receipt-dialog";
import { Alert, InlineMessage } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import { CardLabel } from "@/components/ui/card";
import { IconTile, RadioCard } from "@/components/ui/choice";
import { QueryState } from "@/components/ui/feedback";
import { Modal, ModalActions } from "@/components/ui/modal";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { useStepUp } from "@/features/security/security-check";
import { api } from "@/lib/api/client";
import type { PaymentResult, PayNow, Receipt } from "@/lib/api/types";
import { formatDate, formatMoney, formatTimeOfDay } from "@/lib/format";
import { expiredDefault, initialCardId, payBreakdown, screenFor, usableCards } from "./pay-logic";

const NEW_CARD = "new";

// Botón Pay now: abre el modal de pago en la misma pantalla; acepta los props de Button para el tamaño.
export function PayNowButton({ children, ...props }: Omit<ButtonProps, "onClick">) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button {...props} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <PayDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// Pay now en un solo modal: monto fijo, tarjeta guardada o nueva, rechazo y confirmación con el recibo.
export function PayDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Pay");
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} title={t("title")} locked={busy} onClose={onClose}>
      <PayBody setBusy={setBusy} onClose={onClose} />
    </Modal>
  );
}

function PayBody({ setBusy, onClose }: { setBusy: (busy: boolean) => void; onClose: () => void }) {
  const query = usePortalQuery("pay", () => api.GET("/pay"));
  const [result, setResult] = useState<PaymentResult | null>(null);

  return (
    <>
      <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
      {query.data &&
        (screenFor(result) === "approved" && result ? (
          <Approved result={result} onClose={onClose} />
        ) : (
          <Review pay={query.data} declined={result !== null} setBusy={setBusy} onClose={onClose} onResult={setResult} onRetry={() => setResult(null)} />
        ))}
    </>
  );
}

function Review({
  pay,
  declined,
  setBusy,
  onClose,
  onResult,
  onRetry,
}: {
  pay: PayNow;
  declined: boolean;
  setBusy: (busy: boolean) => void;
  onClose: () => void;
  onResult: (r: PaymentResult) => void;
  onRetry: () => void;
}) {
  const t = useTranslations("Pay");
  const queryClient = useQueryClient();
  const usable = usableCards(pay.cards);
  const [selected, setSelected] = useState<number | typeof NEW_CARD | null>(() => initialCardId(pay) ?? (usable.length === 0 ? NEW_CARD : null));
  const [draft, setDraft] = useState<CardDraft>(() => emptyDraft(usable.length === 0));
  const [busy, setLocalBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());
  const { run, sheet } = useStepUp();
  const expired = expiredDefault(pay.cards);
  const breakdown = payBreakdown(pay);
  const cardIncomplete = selected === NEW_CARD && Object.keys(validateDraft(draft)).length > 0;

  // Un intento nuevo (otra tarjeta tras un rechazo) lleva otra clave.
  useEffect(() => {
    if (!declined) idempotencyKey.current = crypto.randomUUID();
  }, [declined]);

  if (!pay.payable) {
    return (
      <>
        <p className="py-2 text-center font-bold">{t("nothingDue")}</p>
        <ModalActions>
          <Button size="md" onClick={onClose}>
            {t("close")}
          </Button>
        </ModalActions>
      </>
    );
  }

  const working = (value: boolean) => {
    setLocalBusy(value);
    setBusy(value);
  };

  const charge = async (): Promise<"step_up" | void> => {
    working(true);
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
      working(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-1 rounded-xl bg-surface-alt px-4 py-3.5">
        <CardLabel>{t("amountDue")}</CardLabel>
        <span className="text-[30px] leading-tight font-extrabold text-navy">{formatMoney(pay.amount)}</span>
        {breakdown && <span className="text-sm font-semibold text-ink-muted">{breakdown}</span>}
        <span className="text-[13px] text-ink-muted">{t("subtitle")}</span>
      </div>

      {expired && usable.length > 0 && <Alert tone="warning">{t("defaultExpired", { card: cardLabel(expired) })}</Alert>}
      {usable.length === 0 && <Alert tone="warning">{expired ? t("noCard", { card: cardLabel(expired) }) : t("noCardAtAll")}</Alert>}

      <div className="flex flex-col gap-2.5">
        <CardLabel>{t("payWith")}</CardLabel>
        <div role="radiogroup" className="flex flex-col gap-2.5">
          {usable.map((card) => (
            <RadioCard key={card.id} checked={selected === card.id} onSelect={() => setSelected(card.id)}>
              <BrandBadge brand={card.brand} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-extrabold whitespace-nowrap">{cardLabel(card)}</span>
                <span className="text-[13px] font-semibold text-ink-muted">{t("expires", { expiration: card.expiration })}</span>
              </span>
              {card.is_default && <Badge tone="brand">{t("monthlyChip")}</Badge>}
            </RadioCard>
          ))}
          <RadioCard checked={selected === NEW_CARD} onSelect={() => setSelected(NEW_CARD)}>
            <span className="flex h-7 w-11 items-center justify-center rounded-md border-[1.5px] border-dashed border-line-strong text-ink-muted">
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="text-[15px] font-extrabold">{t("useNewCard")}</span>
          </RadioCard>
        </div>
      </div>
      {selected === NEW_CARD && <CardForm draft={draft} onChange={setDraft} showErrors={false} defaultLabel="saveForMonthly" />}

      {declined && (
        <Alert
          tone="danger"
          action={
            <Button
              variant="danger"
              size="sm"
              block
              onClick={() => {
                onRetry();
                setSelected(usable.find((card) => card.id !== selected)?.id ?? NEW_CARD);
              }}
            >
              {t("tryAnother")}
            </Button>
          }
        >
          {t("declined")}
        </Alert>
      )}
      {error && <InlineMessage>{error}</InlineMessage>}

      <ModalActions>
        {selected === NEW_CARD && <MissingNote draft={draft} />}
        <Button variant="ghost" size="md" disabled={busy} onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button size="md" disabled={busy || selected === null || declined || cardIncomplete} onClick={() => void run(charge)}>
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {busy ? t("processing") : t("pay", { amount: formatMoney(pay.amount) })}
        </Button>
      </ModalActions>
      <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-muted md:justify-end">
        <Lock className="size-3.5" strokeWidth={2.5} aria-hidden />
        {t("secure")}
      </p>
      {sheet}
    </>
  );
}

// Fecha local YYYY-MM-DD del momento del cobro.
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function Approved({ result, onClose }: { result: PaymentResult; onClose: () => void }) {
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
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <IconTile tone="success" shape="circle" className="size-16">
        <CircleCheck className="size-9" strokeWidth={2.25} aria-hidden />
      </IconTile>
      <div className="flex flex-col gap-1">
        <span className="text-lg font-extrabold">{t("approved")}</span>
        <span className="text-[34px] leading-tight font-extrabold">{formatMoney(result.amount)}</span>
        <span className="text-sm font-semibold text-ink-muted">
          {t("approvedMeta", { date: formatDate(localDay(paidAt), locale), time: formatTimeOfDay(paidAt, locale) })}
        </span>
        {result.card && <span className="text-sm font-semibold text-ink-muted">{cardLabel(result.card)}</span>}
      </div>
      {result.transaction_id && (
        <Button variant="outline" size="md" block onClick={() => void openReceipt()}>
          <Download className="size-[18px]" strokeWidth={2.25} aria-hidden />
          {t("downloadReceipt")}
        </Button>
      )}
      {failed && <InlineMessage>{t("error")}</InlineMessage>}
      <Button size="md" block onClick={onClose}>
        {t("done")}
      </Button>
      <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
