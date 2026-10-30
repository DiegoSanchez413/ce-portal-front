import { useTranslations } from "next-intl";
import type { BureauScore } from "@/lib/api/types";
import { BUREAU_COLORS, formatDelta, RANGE_STYLES, scoreRange, type Bureau } from "./score";

// Score de un buró: color del rango, chip Poor/Fair/Good y variación (o "First report").
export function ScoreTile({ bureau, value, first = false, size = "lg" }: { bureau: Bureau; value: BureauScore; first?: boolean; size?: "lg" | "md" }) {
  const t = useTranslations("Credit");
  const range = value.score === null ? null : scoreRange(value.score);
  const delta = value.delta === null ? null : formatDelta(value.delta);

  return (
    <div
      className="flex flex-col items-center gap-[5px] overflow-hidden rounded-xl bg-surface-alt px-1.5 pb-3"
      style={{ borderTop: `4px solid ${BUREAU_COLORS[bureau]}` }}
    >
      <span className="pt-2.5 text-center text-[9.5px] leading-tight font-extrabold whitespace-nowrap" style={{ color: BUREAU_COLORS[bureau] }}>
        {t(`bureaus.${bureau}`)}
      </span>
      <span
        className={size === "lg" ? "text-[26px] leading-none font-extrabold" : "text-[22px] leading-none font-extrabold"}
        style={{ color: range ? RANGE_STYLES[range].fg : "#9CA3AF" }}
      >
        {value.score ?? "—"}
      </span>
      {range && <RangeChip range={range} />}
      {delta && <DeltaChip delta={delta} />}
      {first && <span className="py-0.5 text-[11px] font-bold text-[#9CA3AF]">{t("firstReport")}</span>}
    </div>
  );
}

export function RangeChip({ range }: { range: ReturnType<typeof scoreRange> }) {
  const t = useTranslations("Credit");
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ color: RANGE_STYLES[range].fg, background: RANGE_STYLES[range].bg }}>
      {t(`ranges.${range}`)}
    </span>
  );
}

export function DeltaChip({ delta }: { delta: ReturnType<typeof formatDelta> }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ color: delta.fg, background: delta.bg }}>
      {delta.text}
    </span>
  );
}
