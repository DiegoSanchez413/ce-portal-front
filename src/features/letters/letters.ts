import type { Letter } from "@/lib/api/types";

export type LetterType = Letter["type"];
export type Bureau = NonNullable<Letter["bureau"]>;

export const LETTER_TYPES: LetterType[] = ["bureau_response", "court_document", "creditor_letter", "other"];
export const MAX_NOTE = 500;

export const LETTER_STATUS_COLORS: Record<Letter["status"], { fg: string; bg: string }> = {
  received: { fg: "#1D4ED8", bg: "#DBEAFE" },
  reviewed: { fg: "#15803D", bg: "#DCFCE7" },
};

// Formulario listo para enviar: tipo, buró si es respuesta de buró, archivos y nota dentro del límite.
export function canSendLetter(type: LetterType | null, bureau: Bureau | null, files: number, note: string): boolean {
  if (type === null || files === 0) return false;
  if (type === "bureau_response" && bureau === null) return false;
  return note.length <= MAX_NOTE;
}
