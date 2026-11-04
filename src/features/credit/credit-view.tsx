"use client";

import { Download, FileChartColumn } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { InlineMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { IconTile } from "@/components/ui/choice";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader, QueryState } from "@/components/ui/feedback";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { api } from "@/lib/api/client";
import type { CreditReport } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChartLegend, ScoreChart } from "./score-chart";
import { BUREAU_COLORS, BUREAUS, formatDelta, RANGE_TEXT, scoreRange } from "./score";
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
          <IconTile tone="brand-soft" shape="circle" className="size-16">
            <FileChartColumn className="size-7" strokeWidth={2.25} aria-hidden />
          </IconTile>
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
      <DataTable
        className="hidden lg:flex"
        template="1.2fr 1fr 1fr 1fr 96px"
        rowClassName="py-3.5"
        rows={reports}
        rowKey={(report) => report.id}
        columns={[
          { key: "date", header: t("report"), cell: (report) => <span className="text-[15px] font-extrabold">{formatDate(report.date, locale)}</span> },
          ...BUREAUS.map((bureau) => ({
            key: bureau,
            header: <span style={{ color: BUREAU_COLORS[bureau] }}>{t(`bureaus.${bureau}`)}</span>,
            className: "flex flex-wrap items-center gap-1.5",
            cell: (report: CreditReport) => {
              const { score, delta } = report[bureau];
              const range = score === null ? null : scoreRange(score);
              return (
                <>
                  <span className={cn("text-lg font-extrabold", RANGE_TEXT[range ?? "none"])}>{score ?? "—"}</span>
                  {range && <RangeChip range={range} />}
                  {delta !== null && <DeltaChip delta={formatDelta(delta)} />}
                  {report.first_report && score !== null && <span className="text-[11px] font-bold text-faint">{t("firstReport")}</span>}
                </>
              );
            },
          })),
          { key: "pdf", header: "", className: "flex justify-end", cell: (report) => report.has_pdf && <DownloadButton id={report.id} label="PDF" compact /> },
        ]}
      />
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
      <Button variant="outline" size="sm" onClick={() => void download()} disabled={busy} className={compact ? "w-24" : "w-full"}>
        <Download className="size-4" strokeWidth={2.5} aria-hidden />
        {label}
      </Button>
      {failed && <InlineMessage>{t("downloadError")}</InlineMessage>}
    </div>
  );
}
