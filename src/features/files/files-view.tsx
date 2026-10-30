"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Eye, IdCard, Receipt, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { Card, Chip, ErrorNote, ghostButton, PageHeader, primaryButton, QueryState, Sheet, SuccessNote } from "@/features/portal/ui";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { api } from "@/lib/api/client";
import type { Document } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { canUpdate, canView, checkFiles, documentNote, isDocumentType, MAX_DOCUMENT_FILES, STATUS_COLORS, type DocumentType } from "./documents";
import { FilePicker } from "./file-picker";

const ICONS = { id: IdCard, utility_bill: Receipt, ssn: ShieldCheck } as const;

const smallButton =
  "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-[18px] text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-45";

// My Files: estado de cada documento, vista del archivo y carga de una versión nueva.
export function FilesView() {
  const t = useTranslations("Files");
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const query = usePortalQuery("files", () => api.GET("/files"));
  const requested = params.get("update");
  const [updating, setUpdating] = useState<DocumentType | null>(isDocumentType(requested) ? requested : null);
  const [sent, setSent] = useState<DocumentType | null>(null);

  const target = query.data?.find((d) => d.type === updating);
  const sheetOpen = target !== undefined && canUpdate(target);

  const onSent = async (type: DocumentType) => {
    setUpdating(null);
    setSent(type);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["files"] }),
      queryClient.invalidateQueries({ queryKey: ["home"] }),
    ]);
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {sent && <SuccessNote>{t("sent", { doc: t(`lower.${sent}`) })}</SuccessNote>}
      <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
      {query.data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          {query.data.map((doc) => (
            <DocumentCard key={doc.type} doc={doc} onUpdate={() => { setSent(null); setUpdating(doc.type); }} />
          ))}
        </div>
      )}
      {sheetOpen && target && <UpdateSheet type={target.type} onClose={() => setUpdating(null)} onSent={onSent} />}
    </div>
  );
}

function DocumentCard({ doc, onUpdate }: { doc: Document; onUpdate: () => void }) {
  const t = useTranslations("Files");
  const locale = useLocale();
  const Icon = ICONS[doc.type];
  const colors = STATUS_COLORS[doc.status];
  const note = documentNote(doc);
  const [viewState, setViewState] = useState<"idle" | "busy" | "error">("idle");

  const view = async () => {
    if (doc.type === "ssn") return;
    setViewState("busy");
    const popup = window.open("", "_blank");
    try {
      const { data } = await api.POST("/files/{type}/view", { params: { path: { type: doc.type } } });
      if (!data) throw new Error("no url");
      if (popup) popup.location.href = data.url;
      else window.location.href = data.url;
      setViewState("idle");
    } catch {
      popup?.close();
      setViewState("error");
    }
  };

  const expiry = doc.expiration
    ? t(doc.status === "expired" ? "expiredOn" : "expiresOn", { date: formatDate(doc.expiration, locale) })
    : null;

  return (
    <Card className="gap-3 lg:p-6">
      <div className="flex items-center justify-between gap-2.5">
        <span className="flex items-center gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="text-[17px] font-extrabold">{t(`names.${doc.type}`)}</span>
        </span>
        <Chip fg={colors.fg} bg={colors.bg}>{t(`status.${doc.status}`)}</Chip>
      </div>
      {(doc.uploaded_at || expiry) && (
        <div className="flex flex-col gap-0.5 text-[13px] font-semibold text-ink-muted">
          {doc.uploaded_at && <span>{t("uploaded", { date: formatDate(doc.uploaded_at, locale) })}</span>}
          {expiry && <span>{expiry}</span>}
        </div>
      )}
      {doc.status === "missing" && <span className="text-[13px] font-semibold text-ink-muted">{t(doc.type === "ssn" ? "missingOptional" : "missingHint")}</span>}
      {note && (
        <div
          className={cn(
            "rounded-[10px] px-3 py-2.5 text-[13px] leading-snug font-bold",
            note.kind === "warn" ? "bg-[#fef3c7] text-[#b45309]" : "bg-[#fee2e2] text-[#b91c1c]",
          )}
        >
          {note.kind === "warn" ? t("expiresIn", { days: note.days }) : note.reason}
        </div>
      )}
      {(canView(doc) || canUpdate(doc)) && (
        <div className="flex flex-wrap gap-2.5">
          {canView(doc) && (
            <button type="button" onClick={() => void view()} disabled={viewState === "busy"} className={cn(smallButton, "border-[1.5px] border-navy bg-card text-navy hover:bg-muted")}>
              <Eye className="size-4" aria-hidden />
              {t("view")}
            </button>
          )}
          {canUpdate(doc) && (
            <button type="button" onClick={onUpdate} className={cn(smallButton, "bg-brand text-white hover:bg-[#db5a15]")}>
              {t("update")}
            </button>
          )}
        </div>
      )}
      {viewState === "error" && <ErrorNote>{t("viewError")}</ErrorNote>}
    </Card>
  );
}

function UpdateSheet({ type, onClose, onSent }: { type: DocumentType; onClose: () => void; onSent: (type: DocumentType) => Promise<void> }) {
  const t = useTranslations("Files");
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<"form" | "busy" | "error" | "in_review">("form");
  const valid = files.length > 0 && checkFiles(files, MAX_DOCUMENT_FILES) === null;

  const send = async () => {
    if (!valid) return;
    setState("busy");
    const form = new FormData();
    files.forEach((f) => form.append("files[]", f, f.name));
    try {
      const { response } = await api.POST("/files/{type}", {
        params: { path: { type } },
        body: form as unknown as { "files[]": string[] },
        bodySerializer: (body) => body as unknown as FormData,
      });
      if (response.ok) {
        await onSent(type);
        return;
      }
      setState(response.status === 409 ? "in_review" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={t("updateTitle", { doc: t(`lower.${type}`) })} description={t(`help.${type}`)}>
      <FilePicker files={files} onChange={(next) => { setFiles(next); setState("form"); }} max={MAX_DOCUMENT_FILES} />
      {state === "error" && <ErrorNote>{t("sendError")}</ErrorNote>}
      {state === "in_review" && <ErrorNote>{t("alreadyInReview")}</ErrorNote>}
      <div className="flex flex-col gap-1">
        <button type="button" onClick={() => void send()} disabled={!valid || state === "busy"} className={primaryButton}>
          {state === "busy" ? t("sending") : t("send")}
        </button>
        <Dialog.Close className={ghostButton}>{t("cancel")}</Dialog.Close>
      </div>
    </Sheet>
  );
}

