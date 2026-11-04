import type { BadgeTone } from "@/components/ui/badge";
import { colors } from "@/lib/theme/colors";

export type ScoreRange = "poor" | "fair" | "good";
export type Bureau = "equifax" | "experian" | "transunion";

export const BUREAUS: Bureau[] = ["equifax", "experian", "transunion"];

export const BUREAU_COLORS: Record<Bureau, string> = {
  equifax: colors["bureau-equifax"],
  experian: colors["bureau-experian"],
  transunion: colors["bureau-transunion"],
};

export const SCORE_MIN = 300;
export const SCORE_MAX = 850;

// Rangos de score: Poor < 580, Fair 580–669, Good ≥ 670.
export function scoreRange(score: number): ScoreRange {
  if (score >= 670) return "good";
  if (score >= 580) return "fair";
  return "poor";
}

export const RANGE_TONES: Record<ScoreRange, BadgeTone> = { poor: "danger", fair: "warning", good: "success" };

// Color del número del score según su rango; sin score, gris claro.
export const RANGE_TEXT: Record<ScoreRange | "none", string> = { poor: "text-danger-strong", fair: "text-warning", good: "text-success", none: "text-faint" };

// Variación con signo y tono: verde si sube, rojo si baja, gris si no cambia.
export function formatDelta(delta: number): { text: string; tone: BadgeTone } {
  if (delta > 0) return { text: `+${delta}`, tone: "success" };
  if (delta < 0) return { text: `${delta}`, tone: "danger" };
  return { text: "0", tone: "neutral" };
}
