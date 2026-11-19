"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import type { PortfolioSummary } from "@/lib/summary";
import { deleteHolding } from "@/app/actions/investments";
import type { AutocompleteOption } from "@/components/shared/autocomplete";
import { EditDeleteActions } from "@/components/shared/edit-delete-actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { HoldingForm, type Holding } from "./holding-form";
import { DepositsForm } from "./deposits-form";

export function PortfolioSection({
  portfolio: p,
  year,
  typeFilter,
  typeOptions,
}: {
  portfolio: PortfolioSummary;
  year: number;
  typeFilter: string | null;
  typeOptions: AutocompleteOption[];
}) {
  const { t } = useI18n();

  const holdings = typeFilter
    ? p.holdings.filter((h) => h.type === typeFilter)
    : p.holdings;
  const [holdingForm, setHoldingForm] = React.useState<{
    open: boolean;
    editing: Holding | null;
  }>({ open: false, editing: null });
  const [toDelete, setToDelete] = React.useState<Holding | null>(null);
  const [depositsOpen, setDepositsOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      await deleteHolding(toDelete.id);
      toast.success(t.common.delete);
      setToDelete(null);
    });
  }

  const columns: TableColumn<Holding>[] = [
    {
      header: t.investments.instrument,
      cellClassName: "font-medium",
      cell: (h) => h.instrument,
    },
    {
      header: t.common.type,
      cellClassName: "text-muted-foreground",
      cell: (h) => h.type || "—",
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
          onEdit={() => setHoldingForm({ open: true, editing: h })}
          onDelete={() => setToDelete(h)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{p.name}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDepositsOpen(true)}
          >
            {t.investments.setDeposits}
          </Button>
          <Button
            size="sm"
            onClick={() => setHoldingForm({ open: true, editing: null })}
          >
            <Plus /> {t.investments.addHolding}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {holdings.length === 0 ? (
          <CardContent className="py-8">
            <p className="text-center text-sm text-muted-foreground">
              {t.investments.empty}
            </p>
          </CardContent>
        ) : (
          <Table
            columns={columns}
            data={holdings}
            rowKey={(h) => h.id}
            containerClassName="max-h-[min(550px,100dvh)] overflow-y-auto"
          />
        )}
      </Card>

      {holdingForm.open && (
        <HoldingForm
          open
          onClose={() => setHoldingForm((s) => ({ ...s, open: false }))}
          editing={holdingForm.editing}
          portfolioId={p.id}
          year={year}
          typeOptions={typeOptions}
        />
      )}
      {depositsOpen && (
        <DepositsForm
          open
          onClose={() => setDepositsOpen(false)}
          portfolioId={p.id}
          year={year}
          current={p.deposits}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          open
          onClose={() => setToDelete(null)}
          title={t.investments.deleteConfirm}
          description={toDelete.instrument}
          onConfirm={handleDelete}
          loading={pending}
        />
      )}
    </div>
  );
}
