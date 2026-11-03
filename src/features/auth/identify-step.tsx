"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import type { CodeChallenge } from "@/lib/api/types";
import { formatTime } from "./countdown";
import { isValidIdentifier } from "./identifier";
import { getTurnstileToken } from "./turnstile";
import { AuthCard, AuthTitle, CustomerCareLink, FieldError, primaryButton, textLink } from "./ui";

type Props = {
  onCodeSent: (challenge: CodeChallenge) => void;
};

// Pide celular o número de cuenta, valida el formato y solicita el código.
export function IdentifyStep({ onCodeSent }: Props) {
  const t = useTranslations("Login");
  const tCode = useTranslations("Code");
  const locale = useLocale();
  const inputId = useId();
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidIdentifier(value)) {
      setError(t("invalid"));
      return;
    }

    setSending(true);
    setError(null);
    try {
      const token = await getTurnstileToken(turnstileRef.current);
      const { data, error: apiError, response } = await api.POST("/auth/code", {
        body: { identifier: value, language: locale === "es" ? "es" : "en", turnstile_token: token },
      });

      if (data) return onCodeSent(data);
      if (response.status === 423 && apiError?.until) {
        setError(`${tCode("locked")} ${tCode("tryAgainAt", { time: formatTime(apiError.until, locale) })}`);
        return;
      }
      if (response.status === 429) return setError(t("tooMany"));
      setError(response.status === 422 && apiError?.code === "invalid_identifier" ? t("invalid") : t("genericError"));
    } catch {
      setError(t("genericError"));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthCard>
      <div className="flex flex-col items-center gap-3.5 text-center">
        <Image src="/creditexperts-logo.png" alt="" width={64} height={64} className="size-16 rounded-full" />
        <AuthTitle title={t("title")}>{t("subtitle")}</AuthTitle>
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-[22px]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={inputId} className="text-sm font-bold text-navy">
            {t("fieldLabel")}
          </label>
          <input
            id={inputId}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t("placeholder")}
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={error !== null}
            className="min-h-12 w-full rounded-[10px] border-[1.5px] border-line-strong px-4 py-3.5 text-base font-semibold text-navy outline-none focus:border-brand focus:shadow-[0_0_0_3px_#fed7aa] aria-invalid:border-danger"
          />
          {error && <FieldError>{error}</FieldError>}
          <p className="text-[13px] text-ink-muted">{t("helper")}</p>
        </div>
        <div ref={turnstileRef} />
        <button type="submit" disabled={sending} className={primaryButton}>
          {t("continue")}
        </button>
      </form>
      <div className="flex flex-col items-center gap-1.5 border-t border-line-soft pt-3 text-center text-[13px] text-ink-muted">
        <span>
          {t("footerHelp")} <CustomerCareLink />
        </span>
        <a href="https://creditexperts.us" className={textLink}>
          {t("backToSite")}
        </a>
      </div>
    </AuthCard>
  );
}
