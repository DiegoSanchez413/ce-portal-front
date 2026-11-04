"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InlineMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { useStepUp } from "@/features/security/security-check";
import { api } from "@/lib/api/client";
import { CardForm } from "./card-form";
import { CARD_QUERIES } from "./my-cards";
import { type CardDraft, type CardField, emptyDraft, toNewCard, validateDraft } from "./card-validation";

const FIELD_LABEL: Record<CardField, string> = { cardholdername: "name", cardnumber: "number", expiry: "expiry", cvc: "cvc", zipcode: "zip" };

// Modal de alta de tarjeta; al guardar refresca las tarjetas y avisa con onSaved.
export function AddCardDialog({ open, setDefault, onClose, onSaved }: { open: boolean; setDefault: boolean; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("Cards");
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} title={t("addTitle")} locked={busy} onClose={onClose}>
      <AddCardBody setDefault={setDefault} busy={busy} setBusy={setBusy} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

function AddCardBody({ setDefault, busy, setBusy, onClose, onSaved }: { setDefault: boolean; busy: boolean; setBusy: (busy: boolean) => void; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("Cards");
  const queryClient = useQueryClient();
  const { run, sheet } = useStepUp();
  const [draft, setDraft] = useState<CardDraft>(() => emptyDraft(setDefault));
  const [failed, setFailed] = useState<string | null>(null);
  const missing = Object.keys(validateDraft(draft)) as CardField[];

  const save = async (): Promise<"step_up" | void> => {
    setBusy(true);
    setFailed(null);
    try {
      const { error, response } = await api.POST("/cards", { body: toNewCard(draft) });
      const body = error as { code?: string; message?: string } | undefined;
      if (response.status === 403 && body?.code === "step_up_required") return "step_up";
      if (!response.ok) return setFailed(body?.message ?? t("saveError"));
      await Promise.all(CARD_QUERIES.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      onSaved();
    } catch {
      setFailed(t("saveError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <CardForm draft={draft} onChange={setDraft} showErrors={false} defaultLabel="useForMonthly" />
      {failed && <InlineMessage>{failed}</InlineMessage>}
      <ModalActions>
        <MissingNote draft={draft} />
        <Button variant="ghost" size="md" disabled={busy} onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button size="md" disabled={missing.length > 0 || busy} onClick={() => void run(save)}>
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {busy ? t("saving") : t("save")}
        </Button>
      </ModalActions>
      {sheet}
    </>
  );
}

// "Still needed: CVC, ZIP" junto a los botones mientras la tarjeta empezada tenga datos pendientes.
export function MissingNote({ draft }: { draft: CardDraft }) {
  const t = useTranslations("Cards");
  const missing = Object.keys(validateDraft(draft)) as CardField[];
  const started = Boolean(draft.cardholdername || draft.cardnumber || draft.expiry || draft.cvc || draft.zipcode);
  if (!started || missing.length === 0) return null;
  return (
    <span role="status" className="order-2 text-center text-xs font-semibold text-warning md:order-none md:mr-auto md:text-left">
      {t("missing", { fields: missing.map((key) => t(FIELD_LABEL[key])).join(", ") })}
    </span>
  );
}
