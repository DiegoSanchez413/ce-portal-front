"use client";

import { Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import type { CodeChallenge, LoginError, SignInResult } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { formatCountdown, formatTime, useSecondsUntil } from "./countdown";
import { AuthCard, AuthTitle, Banner, CustomerCareLink, FieldError, primaryButton } from "./ui";

const LENGTH = 6;

type Props = {
  challenge: CodeChallenge;
  onChallenge: (challenge: CodeChallenge) => void;
  onResult: (result: SignInResult, keepSignedIn: boolean) => void;
  onRestart: () => void;
};

type CodeError = { kind: "incorrect"; attemptsLeft: number } | { kind: "expired" } | { kind: "tooMany" } | { kind: "generic" };

// Seis casillas del código, reenvío con contador, cambio de canal y bloqueo por intentos.
export function CodeStep({ challenge, onChallenge, onResult, onRestart }: Props) {
  const t = useTranslations("Code");
  const locale = useLocale();
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(""));
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState<CodeError | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const resendIn = useSecondsUntil(challenge.resend_available_at);
  const lockSeconds = useSecondsUntil(lockedUntil);
  const locked = lockedUntil !== null && lockSeconds > 0;

  const handleError = useCallback(
    (status: number, body: LoginError | undefined) => {
      if (status === 410) return onRestart();
      if (status === 429 && body?.until) return onChallenge({ ...challenge, resend_available_at: body.until });
      if (status === 429) return setError({ kind: "tooMany" });
      if (status === 423 && body?.until) {
        setLockedUntil(body.until);
        setDigits(Array(LENGTH).fill(""));
        setError(null);
        return;
      }
      if (body?.code === "incorrect_code") return setError({ kind: "incorrect", attemptsLeft: body.attempts_left ?? 0 });
      if (body?.code === "expired_code") return setError({ kind: "expired" });
      setError({ kind: "generic" });
    },
    [challenge, onChallenge, onRestart],
  );

  const verify = useCallback(
    async (code: string) => {
      if (code.length !== LENGTH || busy) return;
      setBusy(true);
      try {
        const { data, error: body, response } = await api.POST("/auth/verify", {
          body: { challenge_id: challenge.challenge_id, code, keep_signed_in: keepSignedIn },
        });
        if (data) return onResult(data, keepSignedIn);
        handleError(response.status, body);
      } catch {
        setError({ kind: "generic" });
      } finally {
        setBusy(false);
      }
    },
    [busy, challenge.challenge_id, handleError, keepSignedIn, onResult],
  );

  const send = async (channel: "sms" | "email") => {
    setBusy(true);
    try {
      const { data, error: body, response } = await api.POST("/auth/resend", {
        body: { challenge_id: challenge.challenge_id, channel },
      });
      if (data) {
        setDigits(Array(LENGTH).fill(""));
        setError(null);
        onChallenge(data);
        inputs.current[0]?.focus();
        return;
      }
      handleError(response.status, body);
    } catch {
      setError({ kind: "generic" });
    } finally {
      setBusy(false);
    }
  };

  // Lee el código del SMS cuando el navegador lo permite (WebOTP).
  useEffect(() => {
    if (challenge.channel !== "sms" || !("OTPCredential" in window)) return;
    const controller = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: controller.signal } as CredentialRequestOptions)
      .then((credential) => {
        const code = (credential as (Credential & { code?: string }) | null)?.code;
        if (code && /^\d{6}$/.test(code)) {
          setDigits(code.split(""));
          void verify(code);
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [challenge.challenge_id, challenge.channel]); // eslint-disable-line react-hooks/exhaustive-deps

  const fill = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    if (!typed) {
      setDigits((d) => d.map((v, i) => (i === index ? "" : v)));
      return;
    }
    const next = [...digits];
    typed
      .slice(0, LENGTH - index)
      .split("")
      .forEach((digit, offset) => {
        next[index + offset] = digit;
      });
    setDigits(next);
    setError(null);
    inputs.current[Math.min(index + typed.length, LENGTH - 1)]?.focus();
    if (next.every(Boolean)) void verify(next.join(""));
  };

  const keyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const errorText =
    error?.kind === "incorrect"
      ? t("incorrect", { count: error.attemptsLeft })
      : error?.kind === "expired"
        ? t("expired")
        : error?.kind === "tooMany"
          ? t("tooMany")
        : error
          ? t("genericError")
          : null;

  return (
    <AuthCard>
      <AuthTitle title={t("title")}>
        {t.rich("sentTo", {
          destination: challenge.destination,
          strong: (chunks) => <strong className="text-navy">{chunks}</strong>,
        })}
      </AuthTitle>

      {locked && (
        <Banner tone="danger" icon={<Lock className="mt-px size-[18px] shrink-0 text-danger" strokeWidth={2.25} aria-hidden />}>
          {t("locked")}
        </Banner>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void verify(digits.join(""));
        }}
        className="flex flex-col gap-[22px]"
      >
        <div className="flex flex-col gap-2.5">
          <div role="group" aria-label={t("codeLabel")} className="flex gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputs.current[index] = el;
                }}
                value={digit}
                onChange={(e) => fill(index, e.target.value)}
                onKeyDown={(e) => keyDown(index, e)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={index === 0 ? LENGTH : 1}
                autoFocus={index === 0}
                disabled={locked}
                aria-label={t("digit", { n: index + 1 })}
                aria-invalid={error?.kind === "incorrect"}
                className={cn(
                  "h-14 w-full min-w-0 flex-1 rounded-xl border-[1.5px] border-line-strong bg-card text-center text-2xl font-extrabold text-navy outline-none",
                  "focus:border-brand focus:shadow-[0_0_0_3px_#fed7aa] aria-invalid:border-danger",
                  "disabled:bg-[#f3f4f6] disabled:opacity-60",
                )}
              />
            ))}
          </div>
          {errorText && <FieldError>{errorText}</FieldError>}
        </div>

        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold text-navy">
          <input
            type="checkbox"
            checked={keepSignedIn}
            onChange={(e) => setKeepSignedIn(e.target.checked)}
            className="size-[22px] accent-brand"
          />
          {t("keepSignedIn")}
        </label>

        <button type="submit" disabled={locked || busy || digits.some((d) => !d)} className={primaryButton}>
          {t("verify")}
        </button>
      </form>

      <div className="flex flex-col items-center gap-1 text-center text-sm">
        {locked ? (
          <p className="flex min-h-11 items-center font-bold text-[#9ca3af]">
            {t("tryAgainAt", { time: formatTime(lockedUntil, locale) })}
          </p>
        ) : resendIn > 0 ? (
          <p className="flex min-h-11 items-center font-bold text-[#9ca3af]">
            {t("resendIn", { time: formatCountdown(resendIn) })}
          </p>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void send(challenge.channel)}
            className="min-h-11 rounded-full px-4 font-bold text-brand hover:bg-brand-soft"
          >
            {t("resend")}
          </button>
        )}
        {challenge.email && (
          <button
            type="button"
            disabled={locked || busy}
            onClick={() => void send(challenge.channel === "sms" ? "email" : "sms")}
            className="min-h-11 font-bold text-brand hover:underline disabled:text-[#9ca3af] disabled:no-underline"
          >
            {challenge.channel === "sms" ? t("sendEmail") : t("sendPhone")}
          </button>
        )}
        <span className="pt-1.5 text-[13px] text-ink-muted">
          {t("changedNumber")} <CustomerCareLink />
        </span>
      </div>
    </AuthCard>
  );
}
