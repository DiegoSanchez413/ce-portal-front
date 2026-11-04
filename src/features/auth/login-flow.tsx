"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LANGUAGE_SYNCED } from "@/features/session/leave-portal";
import { fetchSession, SESSION_KEY } from "@/features/session/session-query";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { ClientOption, CodeChallenge, Reactivation, SignInResult } from "@/lib/api/types";
import { CodeStep } from "./code-step";
import { IdentifyStep } from "./identify-step";
import { NoAccess } from "./no-access";
import { SelectClientStep } from "./select-client-step";
import { InlineMessage } from "@/components/ui/alert";

type Step =
  | { name: "identify" }
  | { name: "code"; challenge: CodeChallenge }
  | { name: "select"; challengeId: string; clients: ClientOption[]; keepSignedIn: boolean }
  | { name: "no_access"; reactivation: Reactivation | undefined };

// Ingreso completo: identificar, código, selector de cliente y, según el caso, sin acceso o al portal.
export function LoginFlow() {
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const t = useTranslations("Login");
  const [step, setStep] = useState<Step>({ name: "identify" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const common = useTranslations("Common");
  const { data: session, isPending } = useQuery({ queryKey: SESSION_KEY, queryFn: fetchSession, retry: false });

  // Con sesión abierta no se muestra el login: va a Inicio ya en el idioma del cliente, sin un segundo cambio en el portal.
  useEffect(() => {
    if (session?.kind !== "active") return;
    sessionStorage.setItem(LANGUAGE_SYNCED, session.session.account.id);
    router.replace("/", { locale: session.session.language ?? locale });
  }, [session, router, locale]);

  const restart = () => setStep({ name: "identify" });

  const handleResult = (result: SignInResult, challengeId: string, keepSignedIn: boolean) => {
    if (result.status === "signed_in") {
      queryClient.removeQueries({ queryKey: ["session"] });
      router.replace("/");
      return;
    }
    if (result.status === "select_client") {
      setStep({ name: "select", challengeId, clients: result.clients ?? [], keepSignedIn });
      return;
    }
    setStep({ name: "no_access", reactivation: result.reactivation });
  };

  const selectClient = async (challengeId: string, leadId: number, keepSignedIn: boolean) => {
    setBusy(true);
    setError(false);
    try {
      const { data, response } = await api.POST("/auth/select-client", {
        body: { challenge_id: challengeId, lead_id: leadId, keep_signed_in: keepSignedIn },
      });
      if (data) return handleResult(data, challengeId, keepSignedIn);
      if (response.status === 410) return restart();
      setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  // Mientras se sabe si hay sesión (o se está entrando al portal) no se dibuja el formulario.
  if (isPending || session?.kind === "active") {
    return (
      <div aria-busy className="flex flex-1 items-center justify-center py-24">
        <LoaderCircle className="size-8 animate-spin text-brand" aria-hidden />
        <span className="sr-only">{common("loading")}</span>
      </div>
    );
  }

  switch (step.name) {
    case "identify":
      return <IdentifyStep onCodeSent={(challenge) => setStep({ name: "code", challenge })} />;
    case "code":
      return (
        <CodeStep
          key={step.challenge.challenge_id}
          challenge={step.challenge}
          onChallenge={(challenge) => setStep({ name: "code", challenge })}
          onResult={(result, keep) => handleResult(result, step.challenge.challenge_id, keep)}
          onRestart={restart}
        />
      );
    case "select":
      return (
        <div className="flex flex-col gap-3">
          <SelectClientStep
            clients={step.clients}
            busy={busy}
            onSelect={(leadId) => void selectClient(step.challengeId, leadId, step.keepSignedIn)}
            onUseDifferentNumber={restart}
          />
          {error && <InlineMessage className="justify-center">{t("genericError")}</InlineMessage>}
        </div>
      );
    case "no_access":
      return <NoAccess reactivation={step.reactivation} />;
  }
}
