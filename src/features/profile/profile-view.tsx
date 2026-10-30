"use client";

import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { Card, ErrorNote, ghostButton, outlineButton, PageHeader, primaryButton, QueryState, Sheet } from "@/features/portal/ui";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { api } from "@/lib/api/client";
import type { Profile } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const FIELDS = ["mobile", "email", "address", "other"] as const;
type Field = (typeof FIELDS)[number];
const MAX_DETAILS = 500;

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
            <button type="button" onClick={() => setOpen(true)} className={outlineButton}>
              {t("requestChange")}
            </button>
          </Card>
        </div>
      )}
      {open && <ChangeRequestSheet onClose={() => setOpen(false)} />}
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

function ChangeRequestSheet({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Profile");
  const [field, setField] = useState<Field | null>(null);
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"form" | "busy" | "sent" | "error">("form");
  const valid = field !== null && details.trim().length > 0;

  const send = async () => {
    if (!field || !valid) return;
    setState("busy");
    try {
      const { response } = await api.POST("/profile/change-request", { body: { field, details: details.trim() } });
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <Sheet open onOpenChange={(o) => !o && onClose()} title={t("requestChange")}>
        <div className="flex flex-col items-center gap-3 py-3 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-range-good-bg text-range-good">
            <CircleCheck className="size-8" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="text-xl font-extrabold">{t("sentTitle")}</span>
          <span className="text-[15px] text-[#4b5563]">{t("sentSub")}</span>
        </div>
        <Dialog.Close className={outlineButton}>{t("done")}</Dialog.Close>
      </Sheet>
    );
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={t("requestChange")}>
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-sm font-bold">{t("whatToChange")}</legend>
        <div className="flex flex-wrap gap-2.5">
          {FIELDS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={field === key}
              onClick={() => setField(key)}
              className={cn(
                "min-h-[46px] rounded-full border-[1.5px] px-[18px] text-sm font-extrabold",
                field === key ? "border-brand bg-brand-soft text-brand-strong" : "border-line-strong bg-card text-navy",
              )}
            >
              {t(`fields.${key}`)}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="change-details" className="text-sm font-bold">
          {t("details")}
        </label>
        <textarea
          id="change-details"
          value={details}
          maxLength={MAX_DETAILS}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t("detailsPlaceholder")}
          className="min-h-24 w-full resize-y rounded-[10px] border-[1.5px] border-line-strong px-3.5 py-3 text-[15px] font-semibold text-navy outline-none focus:border-brand focus:shadow-[0_0_0_3px_#fed7aa]"
        />
        <span className="self-end text-xs font-semibold text-ink-muted">
          {details.length} / {MAX_DETAILS}
        </span>
      </div>
      {state === "error" && <ErrorNote>{t("error")}</ErrorNote>}
      <div className="flex flex-col gap-1">
        <button type="button" onClick={() => void send()} disabled={!valid || state === "busy"} className={primaryButton}>
          {t("send")}
        </button>
        <Dialog.Close className={ghostButton}>{t("cancel")}</Dialog.Close>
      </div>
    </Sheet>
  );
}
