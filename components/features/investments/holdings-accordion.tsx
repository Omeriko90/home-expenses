"use client";

import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import { groupHoldingsByType } from "@/lib/investments";
import { EditDeleteActions } from "@/components/shared/edit-delete-actions";
import { Accordion } from "@/components/ui/accordion/Accordion";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import type { Holding } from "./holding-form";

export function HoldingsAccordion({
  holdings,
  onEdit,
  onDelete,
}: {
  holdings: Holding[];
  onEdit: (h: Holding) => void;
  onDelete: (h: Holding) => void;
}) {
  const { t } = useI18n();

  const columns: TableColumn<Holding>[] = [
    {
      header: t.investments.instrument,
      cellClassName: "font-medium",
      cell: (h) => h.instrument,
    },
    {
      header: t.investments.house,
      cellClassName: "text-muted-foreground",
      cell: (h) => h.house,
    },
    {
      header: t.investments.channel,
      cellClassName: "text-muted-foreground",
      cell: (h) => h.channel,
    },
    {
      header: t.investments.value,
      headClassName: "text-end",
      cellClassName: "text-end tnum",
      cell: (h) => formatMoney(h.value),
    },
    {
      headClassName: "w-20",
      cell: (h) => (
        <EditDeleteActions
          onEdit={() => onEdit(h)}
          onDelete={() => onDelete(h)}
        />
      ),
    },
  ];

  const groups = groupHoldingsByType(holdings);

  return (
    <Accordion
      type="multiple"
      className="flex flex-col gap-3"
      items={groups.map((g) => ({
        value: g.type || "__none__",
        itemClassName:
          "overflow-hidden rounded-xl border border-border bg-surface shadow-sm shadow-black/[0.03] last:border",
        triggerClassName:
          "px-5 py-5 rounded-t-xl data-[state=closed]:rounded-xl",
        trigger: (
          <>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="font-medium">{g.type || t.common.none}</span>
              <span className="text-sm text-muted-foreground">
                {g.items.length} {t.investments.holdings}
              </span>
            </span>
            <span className="flex flex-col items-end gap-0.5 text-end">
              <span className="text-xs text-muted-foreground">
                {t.investments.totalValue}
              </span>
              <span className="tnum font-medium">{formatMoney(g.sum)}</span>
            </span>
          </>
        ),
        contentClassName: "border-t border-border bg-surface-muted/30",
        content: <Table columns={columns} data={g.items} rowKey={(h) => h.id} />,
      }))}
    />
  );
}
