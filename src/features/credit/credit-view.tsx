"use client";

import { Download, FileChartColumn } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Card, CardLabel, ErrorNote, PageHeader, QueryState, smallOutlineButton } from "@/features/portal/ui";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { api } from "@/lib/api/client";
import type { CreditReport } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChartLegend, ScoreChart } from "./score-chart";
import { BUREAU_COLORS, BUREAUS, formatDelta, RANGE_STYLES, scoreRange } from "./score";
import { DeltaChip, RangeChip, ScoreTile } from "./score-tile";

// My credit: gráfico de evolución y lista de Credit Reports con su PDF.
export function CreditView() {
  const t = useTranslations("Credit");
  const query = usePortalQuery("credit-reports", () => api.GET("/credit-reports"));
  const reports = query.data;

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
      {reports && reports.length === 0 && (
        <Card className="items-center gap-3.5 px-6 py-9 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
            <FileChartColumn className="size-7" strokeWidth={2.25} aria-hidden />
          </span>
          <p className="text-[17px] leading-snug font-extrabold">{t("empty")}</p>
        </Card>
      )}
      {reports && reports.length > 0 && (
        <>
          <Card className="gap-3 lg:gap-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardLabel>{t("evolution")}</CardLabel>
              <ChartLegend className="hidden flex-wrap gap-4 lg:flex" />
            </div>
            <ScoreChart reports={reports} />
            <ChartLegend className="flex flex-wrap justify-center gap-3.5 lg:hidden" />
          </Card>
          <ReportList reports={reports} />
        </>
      )}
    </div>
  );
}

function ReportList({ reports }: { reports: CreditReport[] }) {
  const t = useTranslations("Credit");
  const locale = useLocale();

  return (
    <>
      <div className="flex flex-col gap-4 lg:hidden">
        <CardLabel className="px-1 pt-1.5">{t("reports")}</CardLabel>
        {reports.map((report) => (
          <Card key={report.id} className="p-[18px]">
            <span className="text-base font-extrabold">{formatDate(report.date, locale)}</span>
            <div className="grid grid-cols-3 gap-2">
              {BUREAUS.map((bureau) => (
                <ScoreTile key={bureau} bureau={bureau} value={report[bureau]} first={report.first_report} size="md" />
              ))}
            </div>
            {report.has_pdf && <DownloadButton id={report.id} label={t("downloadPdf")} />}
          </Card>
        ))}
      </div>
      <Card className="hidden gap-0 px-6 py-2 lg:flex">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_96px] gap-4 border-b border-line-soft py-3.5 text-[11px] font-extrabold tracking-[.06em] text-[#9CA3AF] uppercase">
          <span>{t("report")}</span>
          {BUREAUS.map((bureau) => (
            <span key={bureau} style={{ color: BUREAU_COLORS[bureau] }}>
              {t(`bureaus.${bureau}`)}
            </span>
          ))}
          <span />
        </div>
        {reports.map((report) => (
          <div key={report.id} className="grid grid-cols-[1.2fr_1fr_1fr_1fr_96px] items-center gap-4 border-b border-line-soft py-3.5 last:border-b-0">
            <span className="text-[15px] font-extrabold">{formatDate(report.date, locale)}</span>
            {BUREAUS.map((bureau) => {
              const { score, delta } = report[bureau];
              const range = score === null ? null : scoreRange(score);
              return (
                <span key={bureau} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-lg font-extrabold" style={{ color: range ? RANGE_STYLES[range].fg : "#9CA3AF" }}>
                    {score ?? "—"}
                  </span>
                  {range && <RangeChip range={range} />}
                  {delta !== null && <DeltaChip delta={formatDelta(delta)} />}
                  {report.first_report && score !== null && <span className="text-[11px] font-bold text-[#9CA3AF]">{t("firstReport")}</span>}
                </span>
              );
            })}
            <span className="flex justify-end">{report.has_pdf && <DownloadButton id={report.id} label="PDF" compact />}</span>
          </div>
        ))}
      </Card>
    </>
  );
}

// Pide la URL firmada (5 min) y la abre al momento.
function DownloadButton({ id, label, compact = false }: { id: number; label: string; compact?: boolean }) {
  const t = useTranslations("Credit");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const download = async () => {
    setBusy(true);
    setFailed(false);
    const tab = window.open("", "_blank");
    try {
      const { data } = await api.POST("/credit-reports/{id}/download", { params: { path: { id } } });
      if (!data) throw new Error("no url");
      if (tab) tab.location.href = data.url;
      else window.location.href = data.url;
    } catch {
      tab?.close();
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", compact && "items-end")}>
      <button type="button" onClick={() => void download()} disabled={busy} className={cn(smallOutlineButton, compact ? "w-24" : "w-full")}>
        <Download className="size-4" strokeWidth={2.5} aria-hidden />
        {label}
      </button>
      {failed && <ErrorNote>{t("downloadError")}</ErrorNote>}
    </div>
  );
}
