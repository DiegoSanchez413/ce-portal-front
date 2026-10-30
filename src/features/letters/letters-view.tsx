"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { BUREAU_COLORS, BUREAUS } from "@/features/credit/score";
import { checkFiles, MAX_LETTER_FILES } from "@/features/files/documents";
import { FilePicker } from "@/features/files/file-picker";
import { Card, CardLabel, Chip, ErrorNote, outlineButton, primaryButton, QueryState, textLink } from "@/features/portal/ui";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { Letter } from "@/lib/api/types";
import { formatInstantDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { canSendLetter, LETTER_STATUS_COLORS, LETTER_TYPES, MAX_NOTE, type Bureau, type LetterType } from "./letters";

const BUREAU_SOFT_BG: Record<Bureau, string> = { equifax: "#FEF2F2", experian: "#EFF6FF", transunion: "#ECFEFF" };

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
          <Link href="/files" className={textLink}>
            {t("goToFiles")}
          </Link>
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
        <span className="flex size-16 items-center justify-center rounded-full bg-range-good-bg text-range-good">
          <Check className="size-8" strokeWidth={2.5} aria-hidden />
        </span>
        <span role="status" className="text-xl font-extrabold">{t("sentTitle")}</span>
        <span className="text-sm text-ink-muted">
          <LetterTitle letter={sent} /> · {t("fileCount", { count: sent.files })}
        </span>
        <button type="button" onClick={reset} className={cn(outlineButton, "mt-1.5 w-auto px-6 text-sm")}>
          {t("another")}
        </button>
      </Card>
    );
  }

  return (
    <Card className="gap-[18px] lg:p-6">
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-sm font-bold">{t("whatReceived")}</legend>
        <div className="flex flex-wrap gap-2.5">
          {LETTER_TYPES.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={type === key}
              onClick={() => setType(key)}
              className={cn(
                "min-h-[46px] rounded-full border-[1.5px] px-[18px] text-sm font-extrabold",
                type === key ? "border-brand bg-brand-soft text-brand-strong" : "border-line-strong bg-card text-navy hover:border-brand",
              )}
            >
              {t(`types.${key}`)}
            </button>
          ))}
        </div>
      </fieldset>
      {type === "bureau_response" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold">{t("whichBureau")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {BUREAUS.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={bureau === key}
                onClick={() => setBureau(key)}
                className="min-h-[46px] rounded-xl border-[1.5px] border-t-4 px-0.5 py-3 text-xs font-extrabold whitespace-nowrap"
                style={{
                  color: BUREAU_COLORS[key],
                  borderTopColor: BUREAU_COLORS[key],
                  borderColor: bureau === key ? BUREAU_COLORS[key] : "#E5E7EB",
                  background: bureau === key ? BUREAU_SOFT_BG[key] : "#fff",
                }}
              >
                {t(`bureaus.${key}`)}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <FilePicker files={files} onChange={setFiles} max={MAX_LETTER_FILES} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="letter-note" className="text-sm font-bold">
          {t("note")}
        </label>
        <textarea
          id="letter-note"
          value={note}
          maxLength={MAX_NOTE}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("notePlaceholder")}
          className="min-h-[88px] w-full resize-y rounded-[10px] border-[1.5px] border-line-strong px-3.5 py-3 text-[15px] font-semibold text-navy outline-none focus:border-brand focus:shadow-[0_0_0_3px_#fed7aa]"
        />
        <span className="self-end text-xs font-semibold text-ink-muted">
          {note.length} / {MAX_NOTE}
        </span>
      </div>
      {state === "error" && <ErrorNote>{t("sendError")}</ErrorNote>}
      <button type="button" onClick={() => void send()} disabled={!valid || state === "busy"} className={primaryButton}>
        {state === "busy" ? t("sending") : t("send")}
      </button>
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
        {letters.map((letter) => {
          const colors = LETTER_STATUS_COLORS[letter.status];
          return (
            <li key={letter.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card px-[18px] py-4 shadow-[0_4px_20px_rgba(31,42,68,.06)]">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] font-extrabold">
                  <LetterTitle letter={letter} />
                </span>
                <span className="text-[13px] font-semibold text-ink-muted">
                  {formatInstantDate(letter.sent_at, locale)} · {t("fileCount", { count: letter.files })}
                </span>
              </div>
              <Chip fg={colors.fg} bg={colors.bg}>{t(`status.${letter.status}`)}</Chip>
            </li>
          );
        })}
      </ul>
      <div className="hidden rounded-2xl bg-card px-6 py-2 shadow-[0_4px_20px_rgba(31,42,68,.06)] lg:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-[11px] font-extrabold tracking-[.06em] text-[#9ca3af] uppercase">
              <th className="py-3.5 font-extrabold">{t("columns.date")}</th>
              <th className="py-3.5 font-extrabold">{t("columns.letter")}</th>
              <th className="py-3.5 font-extrabold">{t("columns.files")}</th>
              <th className="py-3.5 font-extrabold">{t("columns.status")}</th>
            </tr>
          </thead>
          <tbody>
            {letters.map((letter) => {
              const colors = LETTER_STATUS_COLORS[letter.status];
              return (
                <tr key={letter.id} className="border-b border-line text-[15px] last:border-0">
                  <td className="py-3.5 pr-3 font-extrabold whitespace-nowrap">{formatInstantDate(letter.sent_at, locale)}</td>
                  <td className="py-3.5 pr-3 font-semibold text-[#4b5563]">
                    <LetterTitle letter={letter} />
                  </td>
                  <td className="py-3.5 pr-3 font-semibold whitespace-nowrap text-[#4b5563]">{t("fileCount", { count: letter.files })}</td>
                  <td className="py-3.5">
                    <Chip fg={colors.fg} bg={colors.bg}>{t(`status.${letter.status}`)}</Chip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
