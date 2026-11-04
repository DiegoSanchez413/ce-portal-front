"use client";

import { Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatCountdown, formatTime, useSecondsUntil } from "@/features/auth/countdown";
import { Alert, InlineMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/modal";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const LENGTH = 6;

type Challenge = { challenge_id: string; destination: string; resend_available_at: string };
type ErrorBody = { code?: string; attempts_left?: number; until?: string };

// Quick security check: pide un código al celular de la sesión y avisa cuando se validó.
export function SecurityCheck({ open, onVerified, onCancel }: { open: boolean; onVerified: () => void; onCancel: () => void }) {
  const t = useTranslations("Security");
  const locale = useLocale();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(""));
  // Se guarda qué error hubo, no el texto: al cambiar EN/ES se vuelve a traducir.
  const [error, setError] = useState<{ kind: "incorrect"; count: number } | { kind: "expired" | "error" } | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const resendIn = useSecondsUntil(challenge?.resend_available_at);
  const lockSeconds = useSecondsUntil(lockedUntil);
  const locked = lockedUntil !== null && lockSeconds > 0;

  const handleError = useCallback(
    (status: number, body: ErrorBody | undefined) => {
      if ((status === 423 || (status === 429 && body?.code !== "resend_too_soon")) && body?.until) {
        setLockedUntil(body.until);
        setDigits(Array(LENGTH).fill(""));
        setError(null);
        return;
      }
      if (status === 429 && body?.code === "resend_too_soon" && body.until) {
        setChallenge((c) => (c ? { ...c, resend_available_at: body.until as string } : c));
        return;
      }
      if (body?.code === "incorrect_code") return setError({ kind: "incorrect", count: body.attempts_left ?? 0 });
      if (body?.code === "expired_code") return setError({ kind: "expired" });
      setError({ kind: "error" });
    },
    [],
  );

  const applySent = useCallback(
    (result: { data?: Challenge; error?: unknown; response: Response }) => {
      if (result.data) {
        setChallenge(result.data);
        setDigits(Array(LENGTH).fill(""));
        inputs.current[0]?.focus();
      } else handleError(result.response.status, result.error as ErrorBody | undefined);
    },
    [handleError],
  );

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      applySent(await api.POST("/security/code"));
    } catch {
      setError({ kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  // Se monta al pedirse la verificación: envía el código una sola vez.
  useEffect(() => {
    let active = true;
    api
      .POST("/security/code")
      .then((result) => active && applySent(result))
      .catch(() => active && setError({ kind: "error" }));
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const verify = async (code: string) => {
    if (!challenge || code.length !== LENGTH || busy) return;
    setBusy(true);
    try {
      const { error: body, response } = await api.POST("/security/verify", { body: { challenge_id: challenge.challenge_id, code } });
      if (response.status === 204) return onVerified();
      handleError(response.status, body as ErrorBody | undefined);
    } catch {
      setError({ kind: "error" });
    } finally {
      setBusy(false);
    }
  };

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

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onCancel()} title={t("title")} description={t("text", { destination: challenge?.destination ?? "***-***-****" })}>
      {locked && (
        <Alert tone="danger" icon={<Lock className="mt-px size-[18px] shrink-0 text-danger" strokeWidth={2.25} aria-hidden />}>
          {t("locked")}
        </Alert>
      )}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void verify(digits.join(""));
        }}
        className="flex flex-col gap-4"
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
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
                }}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={index === 0 ? LENGTH : 1}
                disabled={locked || !challenge}
                aria-label={t("digit", { n: index + 1 })}
                aria-invalid={error !== null}
                className={cn(
                  "h-14 w-full min-w-0 flex-1 rounded-xl border-[1.5px] border-line-strong bg-card text-center text-2xl font-extrabold text-navy outline-none",
                  "focus:border-brand focus:shadow-[0_0_0_3px_var(--color-brand-focus)] aria-invalid:border-danger disabled:bg-muted disabled:opacity-60",
                )}
              />
            ))}
          </div>
          {error && <InlineMessage>{error.kind === "incorrect" ? t("incorrect", { count: error.count }) : t(error.kind)}</InlineMessage>}
        </div>
        <Button type="submit" block disabled={locked || busy || !challenge || digits.some((d) => !d)}>
          {t("verify")}
        </Button>
        <div className="flex flex-col items-center gap-1 text-center text-sm">
          {locked && lockedUntil ? (
            <p className="flex min-h-11 items-center font-bold text-faint">{t("tryAgainAt", { time: formatTime(lockedUntil, locale) })}</p>
          ) : resendIn > 0 ? (
            <p className="flex min-h-11 items-center font-bold text-faint">{t("resendIn", { time: formatCountdown(resendIn) })}</p>
          ) : (
            challenge && (
              <button type="button" disabled={busy} onClick={() => void send()} className="min-h-11 rounded-full px-4 font-bold text-brand hover:bg-brand-soft">
                {t("resend")}
              </button>
            )
          )}
          <Button variant="ghost" size="sm" onClick={onCancel} className="px-3 text-[15px]">
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

// Ejecuta una acción que puede pedir el security check: si el back responde step_up_required,
// muestra la verificación y la repite al validarse el código.
export function useStepUp() {
  const [pending, setPending] = useState<(() => Promise<void>) | null>(null);

  const run = useCallback(async (action: () => Promise<"step_up" | void>) => {
    const outcome = await action();
    if (outcome === "step_up") setPending(() => async () => void (await action()));
  }, []);

  const sheet = pending && (
    <SecurityCheck
      open
      onCancel={() => setPending(null)}
      onVerified={() => {
        const retry = pending;
        setPending(null);
        void retry();
      }}
    />
  );

  return { run, sheet };
}
