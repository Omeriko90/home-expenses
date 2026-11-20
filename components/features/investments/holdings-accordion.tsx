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
      items={groups.map((g) => ({
        value: g.type || "__none__",
        triggerClassName: "px-4 py-3",
        trigger: (
          <>
            <span className="flex flex-1 items-center gap-2">
              <span className="font-medium">{g.type || t.common.none}</span>
              <span className="text-sm text-muted-foreground">
                · {g.items.length}
              </span>
            </span>
            <span className="tnum font-medium">{formatMoney(g.sum)}</span>
          </>
        ),
        contentClassName: "border-t border-border bg-surface-muted/30",
        content: <Table columns={columns} data={g.items} rowKey={(h) => h.id} />,
      }))}
    />
  );
}
