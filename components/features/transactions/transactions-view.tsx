"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, cn } from "@/lib/utils";
import { deleteTransaction } from "@/app/actions/transactions";
import { EmptyState } from "@/components/shared/empty-state";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { ImportDialog } from "@/components/features/import/import-dialog";
import { EditDeleteActions } from "@/components/shared/edit-delete-actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TotalsFooterRow } from "@/components/shared/totals-footer-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DropdownMenu } from "@/components/ui/dropdown-menu/DropdownMenu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import {
  TransactionForm,
  type TxRow,
  type TxCategory,
} from "./transaction-form";
import { TransactionFilters, type TxKind } from "./transaction-filters";

export function TransactionsView({
  year,
  month,
  categories,
  rows,
}: {
  year: number;
  month: number;
  categories: TxCategory[];
  rows: TxRow[];
}) {
  const { t } = useI18n();
  const [cats, setCats] = React.useState<string[]>([]);
  const [kind, setKind] = React.useState<TxKind>("all");
  const [amountMin, setAmountMin] = React.useState<number | "">("");
  const [amountMax, setAmountMax] = React.useState<number | "">("");
  const [q, setQ] = React.useState("");
  const [importOpen, setImportOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TxRow | null>(null);
  const [toDelete, setToDelete] = React.useState<TxRow | null>(null);
  const [pending, startTransition] = React.useTransition();

  const deferredQ = React.useDeferredValue(q);
  const deferredMin = React.useDeferredValue(amountMin);
  const deferredMax = React.useDeferredValue(amountMax);
  const { filtered, total } = React.useMemo(() => {
    const needle = deferredQ.toLowerCase();
    const filtered = rows.filter((r) => {
      if (cats.length > 0 && !cats.includes(r.categoryId)) return false;
      if (kind !== "all" && r.kind !== kind) return false;
      if (deferredMin !== "" && r.amount < deferredMin) return false;
      if (deferredMax !== "" && r.amount > deferredMax) return false;
      if (needle && !r.businessName.toLowerCase().includes(needle)) return false;
      return true;
    });
    const total = filtered.reduce((s, r) => s + r.amount, 0);
    return { filtered, total };
  }, [rows, cats, kind, deferredMin, deferredMax, deferredQ]);

  const activeFilters =
    Number(cats.length > 0) +
    Number(kind !== "all") +
    Number(amountMin !== "") +
    Number(amountMax !== "");

  const filterProps = {
    categories,
    cats,
    onCatsChange: setCats,
    kind,
    onKindChange: setKind,
    amountMin,
    onAmountMinChange: setAmountMin,
    amountMax,
    onAmountMaxChange: setAmountMax,
  };

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(r: TxRow) {
    setEditing(r);
    setFormOpen(true);
  }
  function handleDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      await deleteTransaction(toDelete.id);
      toast.success(t.common.delete);
      setToDelete(null);
    });
  }

  const columns: TableColumn<TxRow>[] = [
    {
      header: t.transactions.date,
      headClassName: "w-28",
      cellClassName: "tnum text-muted-foreground",
      cell: (r) => formatDate(r.date),
    },
    {
      header: t.transactions.business,
      cellClassName: "font-medium",
      cell: (r) => r.businessName,
    },
    { header: t.common.category, cell: (r) => r.categoryName },
    {
      header: t.transactions.kind,
      headClassName: "w-24",
      cell: (r) => (
        <Badge variant={r.kind === "FIXED" ? "primary" : "default"}>
          {r.kind === "FIXED" ? t.transactions.fixed : t.transactions.variable}
        </Badge>
      ),
    },
    {
      header: t.common.amount,
      headClassName: "w-32 text-end",
      cellClassName: (r) =>
        cn("text-end tnum font-medium", r.amount < 0 && "text-success"),
      cell: (r) => formatMoney(r.amount, { decimals: true }),
    },
    {
      headClassName: "w-20",
      cell: (r) => (
        <EditDeleteActions
          onEdit={() => openEdit(r)}
          onDelete={() => setToDelete(r)}
        />
      ),
    },
  ];

  return (
    <div className="flex h-[calc(100dvh-7rem-1px)] min-h-0 flex-col gap-3 sm:gap-6">
      <div className="flex items-center justify-between gap-2">
        <MonthYearPicker year={year} month={month} />
        <div className="hidden items-center gap-2 sm:flex">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="bg-surface"
          >
            <Upload /> {t.nav.import}
          </Button>
          <Button onClick={openAdd}>
            <Plus /> {t.transactions.add}
          </Button>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-surface"
                aria-label={t.common.filters}
              >
                <SlidersHorizontal />
                {activeFilters > 0 && (
                  <Badge variant="primary">{activeFilters}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="flex flex-col gap-3 p-4">
              <TransactionFilters layout="xs" {...filterProps} />
            </PopoverContent>
          </Popover>
          <DropdownMenu
            align="end"
            trigger={
              <Button
                variant="outline"
                size="icon"
                className="bg-surface"
                aria-label={t.common.more}
              >
                <MoreHorizontal />
              </Button>
            }
            items={[
              {
                label: t.transactions.add,
                icon: <Plus className="size-4" />,
                onSelect: openAdd,
              },
              {
                label: t.nav.import,
                icon: <Upload className="size-4" />,
                onSelect: () => setImportOpen(true),
              },
            ]}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.common.search}
            className="ps-9"
          />
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <TransactionFilters layout="sm" {...filterProps} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={t.transactions.empty}
          action={
            <Button onClick={openAdd} variant="outline" className="bg-surface">
              <Plus /> {t.transactions.add}
            </Button>
          }
        />
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Table
            columns={columns}
            data={filtered}
            rowKey={(r) => r.id}
            containerClassName="min-h-0 flex-1 overflow-y-auto"
            headerClassName="shadow-divider"
          />
          <TotalsFooterRow>
            <span>
              {filtered.length} {t.transactions.count}
            </span>
            <span className="tnum">
              {t.common.total}: {formatMoney(total, { decimals: true })}
            </span>
          </TotalsFooterRow>
        </Card>
      )}

      {importOpen && <ImportDialog open onClose={() => setImportOpen(false)} />}

      {formOpen && (
        <TransactionForm
          open
          onClose={() => setFormOpen(false)}
          editing={editing}
          categories={categories}
          year={year}
          month={month}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          open
          onClose={() => setToDelete(null)}
          title={t.transactions.deleteConfirm}
          description={toDelete.businessName}
          onConfirm={handleDelete}
          loading={pending}
        />
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}
