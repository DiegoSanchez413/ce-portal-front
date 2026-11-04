"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { BUREAU_COLORS, BUREAUS } from "@/features/credit/score";
import { checkFiles, MAX_LETTER_FILES } from "@/features/files/documents";
import { FilePicker } from "@/features/files/file-picker";
import { InlineMessage } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { IconTile, ToggleChip } from "@/components/ui/choice";
import { DataTable } from "@/components/ui/data-table";
import { QueryState } from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/field";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { Letter } from "@/lib/api/types";
import { formatInstantDate } from "@/lib/format";
import { colors } from "@/lib/theme/colors";
import { canSendLetter, LETTER_STATUS_TONES, LETTER_TYPES, MAX_NOTE, type Bureau, type LetterType } from "./letters";

const BUREAU_SOFT_BG: Record<Bureau, string> = {
  equifax: colors["danger-tint"],
  experian: colors["info-tint"],
  transunion: colors["bureau-transunion-tint"],
};

// Upload Letters: formulario de envío y lista de cartas enviadas.
export function LettersView() {
  const t = useTranslations("Letters");
  const query = usePortalQuery("letters", () => api.GET("/letters"));

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold lg:text-[28px]">{t("title")}</h1>
        <p className="text-sm text-ink-muted lg:text-[15px]">
          {t("filesHint")}{" "}
          <Button asChild variant="link" size="inline" className="font-bold">
            <Link href="/files">{t("goToFiles")}</Link>
          </Button>
        </p>
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6">
        <LetterForm />
        <div className="flex flex-col gap-3">
          <CardLabel className="px-1 pt-1.5">{t("sentLetters")}</CardLabel>
          <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
          {query.data && <SentLetters letters={query.data} />}
        </div>
      </div>
    </div>
  );
}

function LetterForm() {
  const t = useTranslations("Letters");
  const queryClient = useQueryClient();
  const [type, setType] = useState<LetterType | null>(null);
  const [bureau, setBureau] = useState<Bureau | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"form" | "busy" | "error">("form");
  const [sent, setSent] = useState<Letter | null>(null);
  const valid = canSendLetter(type, bureau, files.length, note) && checkFiles(files, MAX_LETTER_FILES) === null;

  const reset = () => {
    setType(null);
    setBureau(null);
    setFiles([]);
    setNote("");
    setState("form");
    setSent(null);
  };

  const send = async () => {
    if (!valid || type === null) return;
    setState("busy");
    const form = new FormData();
    form.append("type", type);
    if (type === "bureau_response" && bureau) form.append("bureau", bureau);
    if (note.trim()) form.append("note", note.trim());
    files.forEach((f) => form.append("files[]", f, f.name));
    try {
      const { data } = await api.POST("/letters", {
        body: form as unknown as { type: LetterType; "files[]": string[] },
        bodySerializer: (body) => body as unknown as FormData,
      });
      if (!data) throw new Error("not sent");
      setSent(data);
      setState("form");
      await queryClient.invalidateQueries({ queryKey: ["letters"] });
    } catch {
      setState("error");
    }
  };

  if (sent) {
    return (
      <Card className="items-center gap-3 py-8 text-center lg:p-6">
        <IconTile tone="success" shape="circle" className="size-16">
          <Check className="size-8" strokeWidth={2.5} aria-hidden />
        </IconTile>
        <span role="status" className="text-xl font-extrabold">{t("sentTitle")}</span>
        <span className="text-sm text-ink-muted">
          <LetterTitle letter={sent} /> · {t("fileCount", { count: sent.files })}
        </span>
        <Button variant="outline" onClick={reset} className="mt-1.5 px-6 text-sm">
          {t("another")}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="gap-[18px] lg:p-6">
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-sm font-bold">{t("whatReceived")}</legend>
        <div className="flex flex-wrap gap-2.5">
          {LETTER_TYPES.map((key) => (
            <ToggleChip key={key} pressed={type === key} onClick={() => setType(key)}>
              {t(`types.${key}`)}
            </ToggleChip>
          ))}
        </div>
      </fieldset>
      {type === "bureau_response" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold">{t("whichBureau")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {BUREAUS.map((key) => (
              <ToggleChip
                key={key}
                pressed={bureau === key}
                onClick={() => setBureau(key)}
                className="justify-center rounded-xl border-t-4 px-0.5 py-3 text-xs whitespace-nowrap"
                style={{
                  color: BUREAU_COLORS[key],
                  borderColor: bureau === key ? BUREAU_COLORS[key] : colors.line,
                  borderTopColor: BUREAU_COLORS[key],
                  background: bureau === key ? BUREAU_SOFT_BG[key] : colors.white,
                }}
              >
                {t(`bureaus.${key}`)}
              </ToggleChip>
            ))}
          </div>
        </fieldset>
      )}
      <FilePicker files={files} onChange={setFiles} max={MAX_LETTER_FILES} />
      <Field label={t("note")} htmlFor="letter-note">
        <Textarea id="letter-note" value={note} maxLength={MAX_NOTE} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} className="min-h-[88px]" />
        <span className="self-end text-xs font-semibold text-ink-muted">
          {note.length} / {MAX_NOTE}
        </span>
      </Field>
      {state === "error" && <InlineMessage>{t("sendError")}</InlineMessage>}
      <Button block onClick={() => void send()} disabled={!valid || state === "busy"}>
        {state === "busy" ? t("sending") : t("send")}
      </Button>
    </Card>
  );
}

function LetterTitle({ letter }: { letter: Pick<Letter, "type" | "bureau"> }) {
  const t = useTranslations("Letters");
  return (
    <>
      {t(`types.${letter.type}`)}
      {letter.bureau && ` · ${t(`bureaus.${letter.bureau}`)}`}
    </>
  );
}

function SentLetters({ letters }: { letters: Letter[] }) {
  const t = useTranslations("Letters");
  const locale = useLocale();

  if (letters.length === 0) {
    return <Card className="text-sm font-semibold text-ink-muted">{t("noLetters")}</Card>;
  }

  return (
    <>
      <ul className="flex flex-col gap-3 lg:hidden">
        {letters.map((letter) => (
            <li key={letter.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card px-[18px] py-4 shadow-card">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] font-extrabold">
                  <LetterTitle letter={letter} />
                </span>
                <span className="text-[13px] font-semibold text-ink-muted">
                  {formatInstantDate(letter.sent_at, locale)} · {t("fileCount", { count: letter.files })}
                </span>
              </div>
              <Badge tone={LETTER_STATUS_TONES[letter.status]}>{t(`status.${letter.status}`)}</Badge>
            </li>
        ))}
      </ul>
      <DataTable
        className="hidden lg:flex"
        template="max-content minmax(0,1fr) max-content max-content"
        rowClassName="py-3.5"
        rows={letters}
        rowKey={(letter) => letter.id}
        columns={[
          { key: "date", header: t("columns.date"), cell: (letter) => <span className="pr-3 font-extrabold whitespace-nowrap">{formatInstantDate(letter.sent_at, locale)}</span> },
          { key: "letter", header: t("columns.letter"), className: "font-semibold text-body", cell: (letter) => <LetterTitle letter={letter} /> },
          { key: "files", header: t("columns.files"), className: "font-semibold whitespace-nowrap text-body", cell: (letter) => t("fileCount", { count: letter.files }) },
          { key: "status", header: t("columns.status"), cell: (letter) => <Badge tone={LETTER_STATUS_TONES[letter.status]}>{t(`status.${letter.status}`)}</Badge> },
        ]}
      />
    </>
  );
}
