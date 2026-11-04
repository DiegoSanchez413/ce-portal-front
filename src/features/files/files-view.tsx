"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Eye, IdCard, Receipt, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Alert, InlineMessage } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/choice";
import { PageHeader, QueryState } from "@/components/ui/feedback";
import { DialogClose, Sheet } from "@/components/ui/modal";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { api } from "@/lib/api/client";
import type { Document } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { canUpdate, canView, checkFiles, documentNote, isDocumentType, MAX_DOCUMENT_FILES, STATUS_TONES, type DocumentType } from "./documents";
import { FilePicker } from "./file-picker";

const ICONS = { id: IdCard, utility_bill: Receipt, ssn: ShieldCheck } as const;

// My Files: estado de cada documento, vista del archivo y carga de una versión nueva.
export function FilesView() {
  const t = useTranslations("Files");
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const router = useRouter();
  const query = usePortalQuery("files", () => api.GET("/files"));
  const requested = params.get("update");
  const [updating, setUpdating] = useState<DocumentType | null>(isDocumentType(requested) ? requested : null);
  const [sent, setSent] = useState<DocumentType | null>(null);
  const [lastRequested, setLastRequested] = useState(requested);

  // Cada Update que llega desde Inicio abre la carga de ese documento, aunque la pantalla ya estuviera montada.
  if (requested !== lastRequested) {
    setLastRequested(requested);
    if (isDocumentType(requested)) {
      setSent(null);
      setUpdating(requested);
    }
  }

  const target = query.data?.find((d) => d.type === updating);
  const sheetOpen = target !== undefined && canUpdate(target);

  const closeSheet = () => {
    setUpdating(null);
    if (requested !== null) router.replace("/files");
  };

  const onSent = async (type: DocumentType) => {
    closeSheet();
    setSent(type);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["files"] }),
      queryClient.invalidateQueries({ queryKey: ["home"] }),
    ]);
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {sent && (
        <Alert tone="success" icon={null}>
          {t("sent", { doc: t(`lower.${sent}`) })}
        </Alert>
      )}
      <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
      {query.data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          {query.data.map((doc) => (
            <DocumentCard key={doc.type} doc={doc} onUpdate={() => { setSent(null); setUpdating(doc.type); }} />
          ))}
        </div>
      )}
      {sheetOpen && target && <UpdateSheet type={target.type} onClose={closeSheet} onSent={onSent} />}
    </div>
  );
}

function DocumentCard({ doc, onUpdate }: { doc: Document; onUpdate: () => void }) {
  const t = useTranslations("Files");
  const locale = useLocale();
  const Icon = ICONS[doc.type];
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
          <IconTile tone="brand-soft">
            <Icon className="size-5" aria-hidden />
          </IconTile>
          <span className="text-[17px] font-extrabold">{t(`names.${doc.type}`)}</span>
        </span>
        <Badge tone={STATUS_TONES[doc.status]}>{t(`status.${doc.status}`)}</Badge>
      </div>
      {(doc.uploaded_at || expiry) && (
        <div className="flex flex-col gap-0.5 text-[13px] font-semibold text-ink-muted">
          {doc.uploaded_at && <span>{t("uploaded", { date: formatDate(doc.uploaded_at, locale) })}</span>}
          {expiry && <span>{expiry}</span>}
        </div>
      )}
      {doc.status === "missing" && <span className="text-[13px] font-semibold text-ink-muted">{t(doc.type === "ssn" ? "missingRequested" : "missingHint")}</span>}
      {note && (
        <div
          className={cn(
            "rounded-[10px] px-3 py-2.5 text-[13px] leading-snug font-bold",
            note.kind === "warn" ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger-strong",
          )}
        >
          {note.kind === "warn" ? t("expiresIn", { days: note.days }) : note.reason}
        </div>
      )}
      {(canView(doc) || canUpdate(doc)) && (
        <div className="flex flex-wrap gap-2.5">
          {canView(doc) && (
            <Button variant="outline" size="sm" onClick={() => void view()} disabled={viewState === "busy"} className="flex-1 gap-1.5 px-[18px]">
              <Eye className="size-4" aria-hidden />
              {t("view")}
            </Button>
          )}
          {canUpdate(doc) && (
            <Button size="sm" onClick={onUpdate} className="flex-1 px-[18px] shadow-none">
              {t("update")}
            </Button>
          )}
        </div>
      )}
      {viewState === "error" && <InlineMessage>{t("viewError")}</InlineMessage>}
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
      {state === "error" && <InlineMessage>{t("sendError")}</InlineMessage>}
      {state === "in_review" && <InlineMessage>{t("alreadyInReview")}</InlineMessage>}
      <div className="flex flex-col gap-1">
        <Button block onClick={() => void send()} disabled={!valid || state === "busy"}>
          {state === "busy" ? t("sending") : t("send")}
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

