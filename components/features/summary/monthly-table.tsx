"use client";

import { useI18n } from "@/lib/i18n/context";
import { formatMoney, cn } from "@/lib/utils";
import type { CategorySpendRow, CategoryMonthlySpend } from "@/lib/summary";
import { Table, type TableColumn } from "@/components/ui/table/Table";

type YearValues = {
  year: number;
  values: number[];
  total: number;
  muted: boolean;
};

export function MonthlyTable({
  year,
  row,
  monthly,
}: {
  year: number;
  row: CategorySpendRow;
  monthly: CategoryMonthlySpend;
}) {
  const { t } = useI18n();

  const columns: TableColumn<YearValues>[] = [
    {
      headClassName: "h-9 ps-4",
      cellClassName: "py-2.5 ps-4 font-medium tnum",
      cell: (r) => r.year,
    },
    ...t.months.map(
      (m, i): TableColumn<YearValues> => ({
        header: m,
        headClassName: "h-9 text-end",
        cellClassName: "py-2.5 text-end tnum whitespace-nowrap",
        cell: (r) =>
          r.values[i] === 0 ? (
            <span className="text-faint">—</span>
          ) : (
            formatMoney(r.values[i])
          ),
      }),
    ),
    {
      header: t.common.total,
      headClassName: "h-9 text-end",
      cellClassName: "py-2.5 text-end tnum font-semibold whitespace-nowrap",
      cell: (r) => formatMoney(r.total),
    },
    {
      header: t.summary.monthlyAvg,
      headClassName: "h-9 pe-4 text-end",
      cellClassName: "py-2.5 pe-4 text-end tnum whitespace-nowrap",
      cell: (r) => formatMoney(r.total / 12),
    },
  ];

  return (
    <Table
      columns={columns}
      data={[
        { year, values: monthly.current, total: row.current, muted: false },
        { year: year - 1, values: monthly.previous, total: row.previous, muted: true },
      ]}
      rowKey={(r) => r.year}
      headRowClassName="hover:bg-transparent"
      rowClassName={(r) =>
        cn("hover:bg-transparent", r.muted && "text-muted-foreground")
      }
    />
  );
}
