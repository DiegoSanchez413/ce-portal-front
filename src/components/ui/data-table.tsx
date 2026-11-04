"use client";

import type { ReactNode } from "react";
import { useFitViewport } from "@/lib/use-fit-viewport";
import { cn } from "@/lib/utils";
import { Card } from "./card";

export type Column<T> = { key: string; header: ReactNode; cell: (row: T, index: number) => ReactNode; className?: string; headerClassName?: string };

// Grilla de escritorio dentro de una tarjeta: columnas con template CSS (columns = "1fr 2fr 120px") y encabezado fijo.
// fit la ajusta al alto que queda en la pantalla y hace scroll adentro desde fitFrom px de ancho.
export function DataTable<T>({
  columns,
  template,
  rows,
  rowKey,
  fit = false,
  fitFrom = 1024,
  rowClassName,
  className,
}: {
  columns: Column<T>[];
  template: string;
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  fit?: boolean;
  fitFrom?: number;
  rowClassName?: string;
  className?: string;
}) {
  const { ref, style } = useFitViewport<HTMLDivElement>(fit ? fitFrom : null);
  const grid = { gridTemplateColumns: template };

  return (
    <div ref={ref} style={style} className={cn("flex min-h-0 flex-col", className)}>
      <Card className="min-h-0 gap-0 px-6 py-2">
        <div role="row" style={grid} className="grid shrink-0 gap-4 border-b border-line-soft py-3.5 text-[11px] font-extrabold tracking-[.06em] text-faint uppercase">
          {columns.map((column) => (
            <span key={column.key} role="columnheader" className={column.headerClassName}>
              {column.header}
            </span>
          ))}
        </div>
        <div className="-mx-6 min-h-0 overflow-y-auto px-6">
          {rows.map((row, i) => (
            <div key={rowKey(row, i)} role="row" style={grid} className={cn("grid items-center gap-4 border-b border-line-soft py-3 text-[15px] last:border-b-0", rowClassName)}>
              {columns.map((column) => (
                <div key={column.key} role="cell" className={cn("min-w-0", column.className)}>
                  {column.cell(row, i)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
