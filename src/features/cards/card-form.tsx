"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Alert, InlineMessage } from "@/components/ui/alert";
import { Checkbox, Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { CardScan, type ScannedCard } from "./card-scan";
import { BRAND_LABEL, type CardDraft, type CardField, detectBrand, digits, luhn, validateDraft } from "./card-validation";

type Fill = "holder" | "number" | "month" | "year";

const filling = "border-brand bg-brand-tint shadow-[0_0_0_4px_var(--color-brand-focus)] transition-[box-shadow,background-color] duration-200";
const filled = "animate-[field-filled_1.6s_ease-out] motion-reduce:animate-none";
const toBlocks = (value: string) => [0, 4, 8, 12].map((from) => value.slice(from, from + 4));

// Alta de tarjeta: vista previa que gira en el CVC, número en 4 bloques y escaneo que escribe los datos.
// Avisa cada cambio al padre como CardDraft; showErrors muestra todos los errores de validación.
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
  const [holder, setHolder] = useState(draft.cardholdername);
  const [blocks, setBlocks] = useState(() => toBlocks(digits(draft.cardnumber)));
  const [month, setMonth] = useState(draft.expiry.split("/")[0] ?? "");
  const [year, setYear] = useState(draft.expiry.split("/")[1] ?? "");
  const [cvc, setCvc] = useState(draft.cvc);
  const [zip, setZip] = useState(draft.zipcode);
  const [showBack, setShowBack] = useState(false);
  const [prefill, setPrefill] = useState<ScannedCard | null>(null);
  const [fillingField, setFillingField] = useState<Fill | null>(null);
  const [filledFields, setFilledFields] = useState<Fill[]>([]);
  const [scanned, setScanned] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const fields = useRef<(HTMLInputElement | null)[]>([]);
  const latest = useRef({ draft, onChange });
  useEffect(() => {
    latest.current = { draft, onChange };
  });

  const number = blocks.join("");
  const brand = detectBrand(number);
  const validMonth = /^(0[1-9]|1[0-2])$/.test(month);
  const today = new Date();
  const expired = validMonth && year.length === 2 && (2000 + Number(year)) * 12 + Number(month) < today.getFullYear() * 12 + today.getMonth() + 1;
  const errors = showErrors ? validateDraft(draft) : {};
  const numberWrong = errors.cardnumber || (number.length >= 15 && !luhn(number));

  useEffect(() => {
    const { draft: current, onChange: notify } = latest.current;
    notify({ ...current, cardholdername: holder, cardnumber: number, expiry: month || year ? `${month}/${year}` : "", cvc, zipcode: zip });
  }, [holder, number, month, year, cvc, zip]);

  // Datos leídos de la foto: se borra lo escrito y el efecto los completa campo por campo, resaltando cada uno.
  const startFill = (card: ScannedCard) => {
    setHolder("");
    setBlocks(["", "", "", ""]);
    setMonth("");
    setYear("");
    setCvc("");
    setFilledFields([]);
    setPrefill({ ...card });
  };

  useEffect(() => {
    if (!prefill) return undefined;
    let cancelled = false;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, still ? 0 : ms));
    const type = async (key: Fill, text: string, set: (value: string) => void, delay: number) => {
      setFillingField(key);
      for (let i = 1; i <= text.length && !cancelled; i++) {
        set(text.slice(0, i));
        await wait(delay);
      }
      setFilledFields((prev) => [...prev, key]);
      await wait(250);
    };
    (async () => {
      await wait(150);
      if (prefill.cardholdername && !cancelled) await type("holder", prefill.cardholdername, setHolder, 45);
      if (prefill.cardnumber && !cancelled) await type("number", digits(prefill.cardnumber).slice(0, 16), (part) => setBlocks(toBlocks(part)), 70);
      if (prefill.exp_month && !cancelled) await type("month", String(prefill.exp_month).padStart(2, "0"), setMonth, 120);
      if (prefill.exp_year && !cancelled) await type("year", String(prefill.exp_year % 100).padStart(2, "0"), setYear, 120);
      if (cancelled) return;
      setFillingField(null);
      setScanned(true);
      const next = !prefill.cardnumber ? 0 : !prefill.exp_month ? 4 : !prefill.exp_year ? 5 : 6;
      fields.current[next]?.focus();
      await wait(1600);
      if (!cancelled) setFilledFields([]);
    })();
    return () => {
      cancelled = true;
    };
  }, [prefill]);

  const mark = (key: Fill) => (fillingField === key ? filling : filledFields.includes(key) ? filled : "");
  const advance = (index: number, value: string, max: number) => value.length === max && fields.current[index + 1]?.focus();
  const backOnEmpty = (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) fields.current[index - 1]?.focus();
  };

  // El autocompletado o pegar el número entero en un bloque lo reparte entre los cuatro.
  const spread = (full: string) => {
    setBlocks(toBlocks(full));
    fields.current[Math.min(3, Math.floor((full.length - 1) / 4))]?.focus();
  };
  const setBlock = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const full = digits(e.target.value).slice(0, 16);
    if (i === 0 && full.length > 4) return spread(full);
    const value = full.slice(0, 4);
    setBlocks((prev) => prev.map((block, n) => (n === i ? value : block)));
    advance(i, value, 4);
  };
  const pasteNumber = (e: React.ClipboardEvent) => {
    const pasted = digits(e.clipboardData.getData("text")).slice(0, 16);
    if (pasted.length <= 4) return;
    e.preventDefault();
    spread(pasted);
  };

  const label = (id: string, text: string) => (
    <Label htmlFor={id} required className="mb-1.5 block font-semibold">
      {text}
    </Label>
  );
  const error = (key: CardField) => errors[key] && <InlineMessage>{t(`errors.${key}`)}</InlineMessage>;

  return (
    <div className="flex flex-col gap-4">
      <CardScan
        onStart={() => {
          setScanned(false);
          setScanFailed(false);
        }}
        onResult={startFill}
        onError={() => setScanFailed(true)}
        onManual={() => fields.current[0]?.focus()}
      />
      {scanned && <Alert tone="success">{t("scanned")}</Alert>}
      {scanFailed && <InlineMessage>{t("scanFailed")}</InlineMessage>}

      <div className="flex justify-center perspective-[900px]" aria-hidden>
        <div className={cn("relative h-[158px] w-[260px] transition-transform duration-500 transform-3d motion-reduce:transition-none", showBack && "rotate-y-180")}>
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-between overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--color-navy)_0%,var(--color-navy-light)_100%)] px-4 py-3.5 text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--color-navy)_28%,transparent)] backface-hidden",
              "after:pointer-events-none after:absolute after:top-[-60%] after:right-[-20%] after:h-[200%] after:w-3/4 after:rotate-[18deg] after:bg-linear-115 after:from-white/16 after:to-white/0 after:content-['']",
              fillingField && "shadow-[0_0_0_4px_var(--color-brand-focus),0_12px_28px_color-mix(in_srgb,var(--color-brand)_25%,transparent)]",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="relative h-[27px] w-[38px] rounded bg-[linear-gradient(135deg,var(--color-card-chip-light),var(--color-card-chip)_55%,var(--color-card-chip-shine))] before:absolute before:inset-x-[18%] before:top-[38%] before:h-px before:bg-card-chip-ink/55 before:content-[''] after:absolute after:inset-x-[18%] after:top-[62%] after:h-px after:bg-card-chip-ink/55 after:content-['']" />
              <span className="text-sm font-extrabold tracking-[.04em] italic">{brand ? BRAND_LABEL[brand].toUpperCase() : t("previewBrand")}</span>
            </div>
            <div className="flex gap-2.5 text-lg font-semibold tracking-[.06em] tabular-nums text-shadow-xs text-shadow-black/35">
              {blocks.map((block, i) => (
                <span key={i}>{block || "••••"}</span>
              ))}
            </div>
            <div className="flex items-end justify-between gap-2.5">
              <div className="flex min-w-0 flex-col">
                <small className="text-xs font-semibold tracking-[.1em] text-white/60 uppercase">{t("previewHolder")}</small>
                <span className="truncate text-sm">{holder || t("previewName")}</span>
              </div>
              <div className="flex flex-none flex-col text-right">
                <small className="text-xs font-semibold tracking-[.1em] text-white/60 uppercase">{t("previewExp")}</small>
                <span className="text-sm">
                  {month || t("mm")}/{year || t("yy")}
                </span>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--color-navy)_0%,var(--color-navy-light)_100%)] text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--color-navy)_28%,transparent)] backface-hidden rotate-y-180">
            <span className="mt-[18px] block h-[38px] w-full bg-card-stripe" />
            <div className="mx-4 mt-3.5 flex items-center justify-end gap-2">
              <small className="text-xs font-semibold tracking-[.1em] text-white/60">{t("cvc")}</small>
              <span className="min-w-[62px] rounded bg-white px-2 py-[3px] text-right text-sm tracking-[.12em] text-navy">{cvc ? "•".repeat(cvc.length) : "•••"}</span>
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-12 items-start gap-x-4 gap-y-3 rounded-xl border border-line bg-white p-4">
        <span className="col-span-full text-xs font-semibold tracking-[.06em] text-ink-muted uppercase">{t("info")}</span>
        <div className="col-span-full md:col-span-6">
          {label("card-holder", t("name"))}
          <Input
            id="card-holder"
            ref={(el) => {
              fields.current[7] = el;
            }}
            variant="boxed"
            aria-invalid={Boolean(errors.cardholdername)}
            className={mark("holder")}
            autoComplete="cc-name"
            placeholder={t("example", { value: "Maria Lopez" })}
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
          />
          {error("cardholdername")}
        </div>
        <div className="col-span-full md:col-span-6">
          {label("card-number-0", t("number"))}
          <div className="grid grid-cols-4 gap-2" onPaste={pasteNumber}>
            {blocks.map((block, i) => (
              <Input
                key={i}
                id={`card-number-${i}`}
                ref={(el) => {
                  fields.current[i] = el;
                }}
                variant="boxed"
                aria-invalid={Boolean(numberWrong)}
                className={cn("px-1 text-center tabular-nums", mark("number"))}
                aria-label={t("numberBlock", { n: i + 1 })}
                inputMode="numeric"
                autoComplete={i === 0 ? "cc-number" : "off"}
                placeholder={["4111", "1111", "1111", "1111"][i]}
                value={block}
                onChange={setBlock(i)}
                onKeyDown={backOnEmpty(i)}
              />
            ))}
          </div>
          {numberWrong && <InlineMessage>{t("errors.cardnumber")}</InlineMessage>}
        </div>
        <div className="relative col-span-6 md:col-span-3">
          {label("card-month", t("mm"))}
          {expired && (
            <div role="alert" className="absolute top-[calc(100%+9px)] left-0 z-[5] flex w-max max-w-[250px] flex-col rounded-lg bg-navy px-3 py-2 text-xs leading-snug text-white/85 shadow-[0_10px_24px_color-mix(in_srgb,var(--color-navy)_28%,transparent)] after:absolute after:bottom-full after:left-[26px] after:border-[6px] after:border-transparent after:border-b-navy after:content-['']">
              <strong className="text-sm text-danger-light">{t("expiredTitle")}</strong>
              <span>{t("expiredText", { month, year })}</span>
            </div>
          )}
          <Input
            id="card-month"
            ref={(el) => {
              fields.current[4] = el;
            }}
            variant="boxed"
            aria-invalid={Boolean(expired || errors.expiry)}
            className={cn("text-center", mark("month"))}
            inputMode="numeric"
            autoComplete="cc-exp-month"
            placeholder={t("mm")}
            value={month}
            onChange={(e) => {
              const value = digits(e.target.value).slice(0, 2);
              setMonth(value);
              advance(4, value, 2);
            }}
            onKeyDown={backOnEmpty(4)}
          />
        </div>
        <div className="col-span-6 md:col-span-3">
          {label("card-year", t("yy"))}
          <Input
            id="card-year"
            ref={(el) => {
              fields.current[5] = el;
            }}
            variant="boxed"
            aria-invalid={Boolean(expired || errors.expiry)}
            className={cn("text-center", mark("year"))}
            inputMode="numeric"
            autoComplete="cc-exp-year"
            placeholder={t("yy")}
            value={year}
            onChange={(e) => {
              const d = digits(e.target.value);
              const value = d.length === 4 ? d.slice(2) : d.slice(0, 2);
              setYear(value);
              advance(5, value, 2);
            }}
            onKeyDown={backOnEmpty(5)}
          />
        </div>
        <div className="col-span-6 md:col-span-3">
          {label("card-cvc", t("cvc"))}
          <Input
            id="card-cvc"
            type="password"
            ref={(el) => {
              fields.current[6] = el;
            }}
            variant="boxed"
            aria-invalid={Boolean(errors.cvc)}
            className={"text-center"}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={cvc}
            onChange={(e) => setCvc(digits(e.target.value).slice(0, 4))}
            onFocus={() => setShowBack(true)}
            onBlur={() => setShowBack(false)}
            onKeyDown={backOnEmpty(6)}
          />
        </div>
        <div className="col-span-6 md:col-span-3">
          {label("card-zip", t("zip"))}
          <Input
            id="card-zip"
            variant="boxed"
            aria-invalid={Boolean(errors.zipcode)}
            className={"text-center"}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="90001"
            value={zip}
            onChange={(e) => setZip(digits(e.target.value).slice(0, 5))}
          />
        </div>
        {showErrors && (errors.expiry || errors.cvc || errors.zipcode) && (
          <div className="col-span-full flex flex-col gap-1">
            {error("expiry")}
            {error("cvc")}
            {error("zipcode")}
          </div>
        )}
      </section>

      {month.length === 2 && !validMonth && (
        <Alert tone="danger" icon={null}>
          {t("invalidMonth")}
        </Alert>
      )}
      <Checkbox label={t(defaultLabel)} checked={draft.set_default} onChange={(e) => onChange({ ...draft, set_default: e.target.checked })} />
      <span className="flex items-center gap-2 text-xs text-ink-muted">
        <ShieldCheck className="size-3.5 flex-none" aria-hidden />
        {t("encrypted")}
      </span>
    </div>
  );
}
