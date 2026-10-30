export type ScoreRange = "poor" | "fair" | "good";
export type Bureau = "equifax" | "experian" | "transunion";

export const BUREAUS: Bureau[] = ["equifax", "experian", "transunion"];

export const BUREAU_COLORS: Record<Bureau, string> = {
  equifax: "#B91C1C",
  experian: "#1D4ED8",
  transunion: "#0891B2",
};

export const SCORE_MIN = 300;
export const SCORE_MAX = 850;

// Rangos de score: Poor < 580, Fair 580–669, Good ≥ 670.
export function scoreRange(score: number): ScoreRange {
  if (score >= 670) return "good";
  if (score >= 580) return "fair";
  return "poor";
}

export const RANGE_STYLES: Record<ScoreRange, { fg: string; bg: string }> = {
  poor: { fg: "#B91C1C", bg: "#FEE2E2" },
  fair: { fg: "#B45309", bg: "#FEF3C7" },
  good: { fg: "#15803D", bg: "#DCFCE7" },
};

// Variación con signo y color: verde si sube, rojo si baja, gris si no cambia.
export function formatDelta(delta: number): { text: string; fg: string; bg: string } {
  if (delta > 0) return { text: `+${delta}`, fg: "#15803D", bg: "#DCFCE7" };
  if (delta < 0) return { text: `${delta}`, fg: "#B91C1C", bg: "#FEE2E2" };
  return { text: "0", fg: "#4B5563", bg: "#EEF0F3" };
}
