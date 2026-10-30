"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { FieldError } from "@/features/auth/ui";
import { SuccessNote } from "@/features/portal/ui";
import { cn } from "@/lib/utils";
import { BrandBadge } from "./brand-badge";
import { CardScan, type ScannedCard } from "./card-scan";
import { type CardDraft, type CardField, detectBrand, digits, formatCardNumber, formatExpiry, validateDraft } from "./card-validation";

const input =
  "h-12 w-full rounded-xl border-[1.5px] border-line-strong bg-card px-3.5 text-base font-semibold text-navy outline-none placeholder:text-[#9ca3af] focus:border-brand focus:shadow-[0_0_0_3px_#fed7aa] aria-invalid:border-danger";

// Datos de una tarjeta nueva: escaneo, campos con formato y la casilla del cobro automático.
export function CardForm({
  draft,
  onChange,
  showErrors,
  defaultLabel,
}: {
  draft: CardDraft;
  onChange: (draft: CardDraft) => void;
  showErrors: boolean;
  defaultLabel: "useForMonthly" | "saveForMonthly";
}) {
  const t = useTranslations("Cards");
  const [scanned, setScanned] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const cvc = useRef<HTMLInputElement>(null);
  const name = useRef<HTMLInputElement>(null);
  const errors = showErrors ? validateDraft(draft) : {};
  const set = (field: keyof CardDraft, value: string | boolean) => onChange({ ...draft, [field]: value });

  const applyScan = (card: ScannedCard) => {
    const year = card.exp_year ? card.exp_year % 100 : null;
    onChange({
      ...draft,
      cardholdername: card.cardholdername ?? draft.cardholdername,
      cardnumber: card.cardnumber ? formatCardNumber(card.cardnumber) : draft.cardnumber,
      expiry: card.exp_month && year !== null ? `${String(card.exp_month).padStart(2, "0")}/${String(year).padStart(2, "0")}` : draft.expiry,
      cvc: "",
    });
    setScanned(true);
    setScanFailed(false);
    requestAnimationFrame(() => cvc.current?.focus());
  };

  const field = (key: CardField, label: string, control: React.ReactNode) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-navy">{label}</span>
      {control}
      {errors[key] && <FieldError>{t(`errors.${key}`)}</FieldError>}
    </label>
  );

  return (
    <div className="flex flex-col gap-4">
      <CardScan
        onResult={applyScan}
        onError={() => {
          setScanFailed(true);
          setScanned(false);
        }}
        onManual={() => name.current?.focus()}
      />
      <div className="flex items-center gap-3 text-xs font-bold tracking-wide text-[#9ca3af] uppercase">
        <span className="h-px flex-1 bg-line" />
        {t("orManual")}
        <span className="h-px flex-1 bg-line" />
      </div>
      {scanned && <SuccessNote>{t("scanned")}</SuccessNote>}
      {scanFailed && <FieldError>{t("scanFailed")}</FieldError>}
      {field(
        "cardholdername",
        t("name"),
        <input ref={name} value={draft.cardholdername} onChange={(e) => set("cardholdername", e.target.value)} autoComplete="cc-name" aria-invalid={errors.cardholdername} className={cn(input, scanned && "border-[#86efac]")} />,
      )}
      {field(
        "cardnumber",
        t("number"),
        <span className="relative flex items-center">
          <input
            value={draft.cardnumber}
            onChange={(e) => set("cardnumber", formatCardNumber(e.target.value))}
            inputMode="numeric"
            autoComplete="cc-number"
            aria-invalid={errors.cardnumber}
            className={cn(input, "pr-16", scanned && "border-[#86efac]")}
          />
          {digits(draft.cardnumber).length > 0 && <BrandBadge brand={detectBrand(draft.cardnumber)} className="absolute right-3" />}
        </span>,
      )}
      <div className="grid grid-cols-3 gap-3">
        {field(
          "expiry",
          t("expiry"),
          <input value={draft.expiry} onChange={(e) => set("expiry", formatExpiry(e.target.value))} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" aria-invalid={errors.expiry} className={cn(input, scanned && "border-[#86efac]")} />,
        )}
        {field(
          "cvc",
          t("cvc"),
          <input ref={cvc} value={draft.cvc} onChange={(e) => set("cvc", digits(e.target.value).slice(0, 4))} inputMode="numeric" autoComplete="cc-csc" aria-invalid={errors.cvc} className={cn(input, scanned && "border-brand shadow-[0_0_0_3px_#fed7aa]")} />,
        )}
        {field(
          "zipcode",
          t("zip"),
          <input value={draft.zipcode} onChange={(e) => set("zipcode", digits(e.target.value).slice(0, 5))} inputMode="numeric" autoComplete="postal-code" aria-invalid={errors.zipcode} className={input} />,
        )}
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold text-navy">
        <input type="checkbox" checked={draft.set_default} onChange={(e) => set("set_default", e.target.checked)} className="size-[22px] accent-brand" />
        {t(defaultLabel)}
      </label>
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted">
        <Lock className="size-3.5" strokeWidth={2.5} aria-hidden />
        {t("encrypted")}
      </p>
    </div>
  );
}
