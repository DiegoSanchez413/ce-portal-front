"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { ClientOption, CodeChallenge, Reactivation, SignInResult } from "@/lib/api/types";
import { CodeStep } from "./code-step";
import { IdentifyStep } from "./identify-step";
import { NoAccess } from "./no-access";
import { SelectClientStep } from "./select-client-step";
import { FieldError } from "./ui";

type Step =
  | { name: "identify" }
  | { name: "code"; challenge: CodeChallenge }
  | { name: "select"; challengeId: string; clients: ClientOption[]; keepSignedIn: boolean }
  | { name: "no_access"; reactivation: Reactivation | undefined };

// Ingreso completo: identificar, código, selector de cliente y, según el caso, sin acceso o al portal.
export function LoginFlow() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("Login");
  const [step, setStep] = useState<Step>({ name: "identify" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

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
          {error && <FieldError className="justify-center">{t("genericError")}</FieldError>}
        </div>
      );
    case "no_access":
      return <NoAccess reactivation={step.reactivation} />;
  }
}
