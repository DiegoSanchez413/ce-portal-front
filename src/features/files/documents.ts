import type { BadgeTone } from "@/components/ui/badge";
import type { Document } from "@/lib/api/types";
import { colors } from "@/lib/theme/colors";

export type DocumentType = Document["type"];
export type DocumentStatus = Document["status"];

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_FILES = 3;
export const MAX_LETTER_FILES = 10;
export const EXPIRING_DAYS = 30;

export const STATUS_TONES: Record<DocumentStatus, BadgeTone> = {
  approved: "success",
  in_review: "info",
  rejected: "danger",
  expired: "danger",
  missing: "neutral",
};

export type DocumentNote = { kind: "warn"; days: number } | { kind: "error"; reason: string } | null;

// Nota de la fila: ámbar si vence en 30 días o menos, roja con el motivo si fue rechazado.
export function documentNote(doc: Document): DocumentNote {
  if (doc.status === "rejected" && doc.reject_reason) return { kind: "error", reason: doc.reject_reason };
  if (doc.status === "approved" && doc.expires_in_days !== null && doc.expires_in_days <= EXPIRING_DAYS) {
    return { kind: "warn", days: doc.expires_in_days };
  }
  return null;
}

export function canView(doc: Document): boolean {
  return doc.type !== "ssn" && doc.status !== "missing";
}

export function canUpdate(doc: Document): boolean {
  return doc.status !== "in_review";
}

// Color del estado corto que muestra la tarjeta My Files de Inicio.
export function attentionColor(doc: Document): string {
  if (doc.status === "approved") return colors.warning;
  if (doc.status === "missing") return colors.body;
  return colors.danger;
}

export type FileProblem = "type" | "size" | "count";

// Revisa tipo, tamaño y cantidad antes de enviar; devuelve el primer problema encontrado.
export function checkFiles(files: Pick<File, "type" | "size">[], max: number): FileProblem | null {
  if (files.length > max) return "count";
  if (files.some((f) => !ACCEPTED_TYPES.includes(f.type))) return "type";
  if (files.some((f) => f.size > MAX_FILE_BYTES)) return "size";
  return null;
}

export function isDocumentType(value: string | null): value is DocumentType {
  return value === "id" || value === "utility_bill" || value === "ssn";
}
