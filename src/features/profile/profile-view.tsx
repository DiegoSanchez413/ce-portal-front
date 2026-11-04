"use client";

import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InlineMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile, ToggleChip } from "@/components/ui/choice";
import { PageHeader, QueryState } from "@/components/ui/feedback";
import { Field as FormField, Input } from "@/components/ui/field";
import { DialogClose, Sheet } from "@/components/ui/modal";
import { formatIdentifierInput } from "@/features/auth/identifier";
import { AddressField, addressComplete, type AddressDraft, addressText, emptyAddress } from "./address-field";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { api } from "@/lib/api/client";
import type { Profile } from "@/lib/api/types";

const FIELDS = ["mobile", "email", "address"] as const;
type Field = (typeof FIELDS)[number];
const MAX_VALUE = 200;

// Dato nuevo válido según el campo: celular de 10 dígitos o correo con formato.
function validValue(field: Field, value: string): boolean {
  if (field === "mobile") return value.replace(/\D/g, "").length === 10;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Perfil en solo lectura y solicitud de cambio al Agent.
export function ProfileView() {
  const t = useTranslations("Profile");
  const query = usePortalQuery("profile", () => api.GET("/profile"));
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
      {query.data && (
        <div className="lg:max-w-[620px]">
          <Card className="gap-4 p-[18px] lg:p-7">
            <ProfileRows profile={query.data} />
            <Button variant="outline" block onClick={() => setOpen(true)}>
              {t("requestChange")}
            </Button>
          </Card>
        </div>
      )}
      {open && query.data && <ChangeRequestSheet profile={query.data} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ProfileRows({ profile }: { profile: Profile }) {
  const t = useTranslations("Profile");
  const rows: [string, string | null][] = [
    [t("fullName"), profile.full_name],
    [t("account"), profile.account],
    [t("mobile"), profile.mobile],
    [t("email"), profile.email],
    [t("address"), profile.address],
    [t("dob"), profile.birth_year ? `••/••/${profile.birth_year}` : null],
    [t("plan"), profile.plan],
    [t("specialist"), profile.specialist],
    [t("agent"), profile.agent],
  ];

  return (
    <dl className="flex flex-col">
      {rows.map(([label, value]) => (
        <div key={label} className="flex min-h-12 items-center justify-between gap-4 border-b border-line-soft py-3">
          <dt className="shrink-0 text-sm font-semibold text-ink-muted">{label}</dt>
          <dd className="min-w-0 text-right text-[15px] font-extrabold break-words">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function ChangeRequestSheet({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const t = useTranslations("Profile");
  const [values, setValues] = useState<Partial<Record<Field, string>>>({});
  const [address, setAddress] = useState<AddressDraft>(emptyAddress);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [state, setState] = useState<"form" | "busy" | "sent" | "error">("form");
  const selected = FIELDS.filter((key) => values[key] !== undefined);
  const valueOf = (key: Field) => (key === "address" ? addressText(address) : (values[key] ?? "").trim());
  const valid = selected.length > 0 && selected.every((key) => (key === "address" ? addressComplete(address) : validValue(key, values[key] ?? "")));

  const toggle = (key: Field) =>
    setValues((prev) => {
      const next = { ...prev };
      if (next[key] === undefined) next[key] = "";
      else delete next[key];
      if (key === "address") setAddress(emptyAddress);
      return next;
    });

  const send = async () => {
    if (!valid) return;
    setState("busy");
    try {
      const changes = selected.map((field) => ({ field, value: valueOf(field) }));
      const { response } = await api.POST("/profile/change-request", { body: { changes } });
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <Sheet open onOpenChange={(o) => !o && onClose()} title={t("requestChange")}>
        <div className="flex flex-col items-center gap-3 py-3 text-center">
          <IconTile tone="success" shape="circle" className="size-16">
            <CircleCheck className="size-8" strokeWidth={2.25} aria-hidden />
          </IconTile>
          <span className="text-xl font-extrabold">{t("sentTitle")}</span>
          <span className="text-[15px] text-body">{t("sentSub")}</span>
        </div>
        <DialogClose asChild>
          <Button variant="outline" block>
            {t("done")}
          </Button>
        </DialogClose>
      </Sheet>
    );
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={t("requestChange")}>
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-sm font-bold">{t("whatToChange")}</legend>
        <span className="mb-1.5 text-[13px] text-ink-muted">{t("chooseMany")}</span>
        <div className="flex flex-wrap gap-2.5">
          {FIELDS.map((key) => (
            <ToggleChip key={key} check pressed={values[key] !== undefined} onClick={() => toggle(key)}>
              {t(`fields.${key}`)}
            </ToggleChip>
          ))}
        </div>
      </fieldset>
      {selected.map((key) => {
        if (key === "address") {
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">{t("newValue.address")}</span>
              <AddressField value={address} onChange={setAddress} />
              {profile.address && <span className="text-xs font-semibold text-ink-muted">{t("current", { value: profile.address })}</span>}
            </div>
          );
        }
        const value = values[key] ?? "";
        const wrong = touched[key] && !validValue(key, value);
        return (
          <FormField
            key={key}
            label={t(`newValue.${key}`)}
            htmlFor={`change-${key}`}
            error={wrong && t(`invalid.${key}`)}
            hint={profile[key] && t("current", { value: profile[key] })}
          >
            <Input
              id={`change-${key}`}
              value={value}
              maxLength={MAX_VALUE}
              type={key === "email" ? "email" : "text"}
              inputMode={key === "mobile" ? "tel" : "email"}
              autoComplete={key === "mobile" ? "tel-national" : "email"}
              placeholder={t(`placeholder.${key}`)}
              aria-invalid={wrong}
              onChange={(e) => {
                const next = key === "mobile" ? formatIdentifierInput(e.target.value.replace(/[a-z]/gi, "")) : e.target.value;
                setValues((prev) => ({ ...prev, [key]: next }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, [key]: true }))}
            />
          </FormField>
        );
      })}
      {state === "error" && <InlineMessage>{t("error")}</InlineMessage>}
      <div className="flex flex-col gap-1">
        <Button block onClick={() => void send()} disabled={!valid || state === "busy"}>
          {t("send")}
        </Button>
        <DialogClose asChild>
          <Button variant="ghost" size="sm" block className="text-[15px]">
            {t("cancel")}
          </Button>
        </DialogClose>
      </div>
    </Sheet>
  );
}
