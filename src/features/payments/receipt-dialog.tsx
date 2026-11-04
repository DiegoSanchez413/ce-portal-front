"use client";

import { CircleCheck, Download } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { InlineMessage } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardLabel } from "@/components/ui/card";
import { DialogClose, Sheet } from "@/components/ui/modal";
import type { Receipt } from "@/lib/api/types";
import { formatDate, formatMoney } from "@/lib/format";
import { paymentConcept, planPaymentLine } from "./history";
import { downloadReceiptPdf } from "./receipt-pdf";

type Row = { label: string; value: string };

// Recibo de un pago aprobado: detalle en pantalla y descarga en PDF.
export function ReceiptDialog({ receipt, onClose }: { receipt: Receipt | null; onClose: () => void }) {
  const t = useTranslations("Receipt");
  const pay = useTranslations("Payments");
  const locale = useLocale();
  const [failed, setFailed] = useState(false);

  if (!receipt) return null;

  const concept = paymentConcept(receipt);
  const type = concept.key ? pay(`concepts.${concept.key}`) : (concept.detail ?? "");
  const plan = planPaymentLine(receipt.plan, receipt.plan_payment, (v) => t("planLine", v));
  const method = receipt.card_last4 ? pay("card", { last4: receipt.card_last4 }) : receipt.method && receipt.method !== "card" ? pay(`methods.${receipt.method}`) : "—";
  const rows: Row[] = [
    { label: t("date"), value: formatDate(receipt.date, locale) },
    { label: t("type"), value: concept.key === "charge" && concept.detail ? `${type} · ${concept.detail}` : type },
    { label: t("method"), value: method },
    ...(receipt.transaction_id ? [{ label: t("transactionId"), value: receipt.transaction_id }] : []),
    ...(plan ? [{ label: t("plan"), value: plan }] : []),
    { label: t("client"), value: receipt.client },
    { label: t("account"), value: receipt.account },
  ];

  const download = async () => {
    setFailed(false);
    try {
      await downloadReceiptPdf({
        title: t("title"),
        brand: "Credit Experts",
        amount: receipt.amount,
        rows: [
          ...rows.map((row) => (row.label === t("method") && receipt.card_last4 ? { ...row, value: `XXXX-XXXX-XXXX-${receipt.card_last4}` } : row)),
          { label: t("status"), value: t("approved") },
        ],
        contact: "(855) 517-0390 · customercare@creditexperts.us",
        footer: t("footer"),
        fileName: `ce-receipt-${receipt.transaction_id ?? receipt.date}.pdf`,
      });
    } catch {
      setFailed(true);
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()} title={t("title")} hideTitle>
      <div className="flex items-center gap-3">
        <Image src="/creditexperts-logo.png" alt="" width={44} height={44} className="size-11 shrink-0 rounded-full" />
        <div className="flex flex-col">
          <CardLabel>{t("title")}</CardLabel>
          <span className="text-[15px] font-extrabold">Credit Experts</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 rounded-[14px] bg-surface-alt p-[18px]">
        <span className="text-4xl leading-none font-extrabold">{formatMoney(receipt.amount)}</span>
        <Badge tone="success" className="gap-1.5 px-3">
          <CircleCheck className="size-3.5" strokeWidth={2.75} aria-hidden />
          {t("approved")}
        </Badge>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="font-semibold text-ink-muted">{row.label}</dt>
            <dd className="text-right font-extrabold break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
      {failed && <InlineMessage>{t("pdfError")}</InlineMessage>}
      <div className="flex flex-col gap-2.5">
        <Button block onClick={() => void download()}>
          <Download className="size-[18px]" strokeWidth={2.5} aria-hidden />
          {t("downloadPdf")}
        </Button>
        <DialogClose asChild>
          <Button variant="ghost" size="md" block>
            {t("close")}
          </Button>
        </DialogClose>
      </div>
    </Sheet>
  );
}
