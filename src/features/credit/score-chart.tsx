import { useLocale, useTranslations } from "next-intl";
import type { CreditReport } from "@/lib/api/types";
import { parseDate } from "@/lib/format";
import { colors } from "@/lib/theme/colors";
import { BUREAU_COLORS, BUREAUS, SCORE_MAX, SCORE_MIN } from "./score";

const BANDS = [
  { key: "poor", lo: SCORE_MIN, hi: 579, fill: colors.danger, opacity: 0.07, fg: colors["danger-strong"] },
  { key: "fair", lo: 580, hi: 669, fill: colors["warning-accent"], opacity: 0.08, fg: colors.warning },
  { key: "good", lo: 670, hi: SCORE_MAX, fill: colors["success-accent"], opacity: 0.08, fg: colors.success },
] as const;
const TICKS = [300, 580, 670, 850];
const MAX_LABELS = 6;

// Posición vertical del score en porcentaje (850 arriba, 300 abajo).
export function scoreTop(score: number): number {
  const clamped = Math.min(SCORE_MAX, Math.max(SCORE_MIN, score));
  return ((SCORE_MAX - clamped) / (SCORE_MAX - SCORE_MIN)) * 100;
}

// Posición horizontal de cada reporte, repartidos de forma pareja; uno solo va al centro.
export function reportLeft(index: number, count: number): number {
  return count <= 1 ? 50 : (index / (count - 1)) * 100;
}

// Evolución de scores: una línea por buró sobre las franjas Poor/Fair/Good, del reporte más antiguo al más reciente.
export function ScoreChart({ reports }: { reports: CreditReport[] }) {
  const t = useTranslations("Credit");
  const locale = useLocale() === "es" ? "es-US" : "en-US";
  const points = [...reports].reverse();
  const step = Math.ceil(points.length / MAX_LABELS);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-[220px] pr-11 pl-[34px] lg:h-[240px] lg:pr-16 lg:pl-9">
        <div className="absolute inset-y-0 left-0 w-7 lg:w-[30px]">
          {TICKS.map((tick) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2 text-[11px] leading-none font-bold text-faint lg:text-xs" style={{ top: `${scoreTop(tick)}%` }}>
              {tick}
            </span>
          ))}
        </div>
        <div className="absolute inset-y-0 right-0 w-10 lg:w-14">
          {BANDS.map((band) => (
            <span
              key={band.key}
              className="absolute left-1.5 -translate-y-1/2 text-[10px] leading-none font-extrabold lg:left-2 lg:text-[11px]"
              style={{ top: `${scoreTop((band.lo + band.hi) / 2)}%`, color: band.fg }}
            >
              {t(`ranges.${band.key}`)}
            </span>
          ))}
        </div>
        <div className="relative h-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
            {BANDS.map((band) => (
              <rect key={band.key} x="0" width="100" y={scoreTop(band.hi)} height={scoreTop(band.lo) - scoreTop(band.hi)} fill={band.fill} fillOpacity={band.opacity} />
            ))}
            {BUREAUS.map((bureau) => {
              const line = points
                .map((report, i) => (report[bureau].score === null ? null : `${reportLeft(i, points.length)},${scoreTop(report[bureau].score!)}`))
                .filter(Boolean)
                .join(" ");
              return (
                <polyline key={bureau} points={line} fill="none" stroke={BUREAU_COLORS[bureau]} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              );
            })}
          </svg>
          {BUREAUS.map((bureau) =>
            points.map((report, i) =>
              report[bureau].score === null ? null : (
                <span
                  key={`${bureau}-${report.id}`}
                  className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] bg-white"
                  style={{ left: `${reportLeft(i, points.length)}%`, top: `${scoreTop(report[bureau].score!)}%`, borderColor: BUREAU_COLORS[bureau] }}
                  title={`${t(`bureaus.${bureau}`)}: ${report[bureau].score}`}
                />
              ),
            ),
          )}
        </div>
      </div>
      <div className="relative mr-11 ml-[34px] h-4 lg:mr-16 lg:ml-9">
        {points.map((report, i) =>
          i % step === 0 || i === points.length - 1 ? (
            <span
              key={report.id}
              className="absolute -translate-x-1/2 text-xs font-bold whitespace-nowrap text-ink-muted lg:text-[13px]"
              style={{ left: `${reportLeft(i, points.length)}%` }}
            >
              <span className="lg:hidden">{parseDate(report.date).toLocaleDateString(locale, { month: "short" })}</span>
              <span className="hidden lg:inline">{parseDate(report.date).toLocaleDateString(locale, { month: "short", day: "2-digit" })}</span>
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

export function ChartLegend({ className }: { className?: string }) {
  const t = useTranslations("Credit");
  return (
    <div className={className}>
      {BUREAUS.map((bureau) => (
        <span key={bureau} className="flex items-center gap-1.5 text-[13px] font-extrabold" style={{ color: BUREAU_COLORS[bureau] }}>
          <span className="size-3 rounded-full" style={{ background: BUREAU_COLORS[bureau] }} />
          {t(`bureaus.${bureau}`)}
        </span>
      ))}
    </div>
  );
}
