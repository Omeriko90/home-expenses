"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, cn } from "@/lib/utils";
import { deleteTransaction } from "@/app/actions/transactions";
import { EmptyState } from "@/components/shared/empty-state";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { ImportDialog } from "@/components/features/import/import-dialog";
import { IconButton } from "@/components/shared/icon-button";
import { RowActions } from "@/components/shared/row-actions";
import { MoneyInput } from "@/components/shared/money-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TransactionForm,
  type TxRow,
  type TxCategory,
} from "./transaction-form";

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
  const [cat, setCat] = React.useState<string>("all");
  const [kind, setKind] = React.useState<"all" | "FIXED" | "VARIABLE">("all");
  const [amountMin, setAmountMin] = React.useState<number | "">("");
  const [amountMax, setAmountMax] = React.useState<number | "">("");
  const [q, setQ] = React.useState("");
  const [importOpen, setImportOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TxRow | null>(null);
  const [toDelete, setToDelete] = React.useState<TxRow | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Rows are already scoped to the selected month on the server; the
  // category/type/amount/search refinements happen client-side.
  // The free-text inputs are deferred so keystrokes repaint the input
  // immediately and the (memoized) re-filter runs as a deferred render.
  const deferredQ = React.useDeferredValue(q);
  const deferredMin = React.useDeferredValue(amountMin);
  const deferredMax = React.useDeferredValue(amountMax);
  const { filtered, total } = React.useMemo(() => {
    const needle = deferredQ.toLowerCase();
    const filtered = rows.filter((r) => {
      if (cat !== "all" && r.categoryId !== cat) return false;
      if (kind !== "all" && r.kind !== kind) return false;
      if (deferredMin !== "" && r.amount < deferredMin) return false;
      if (deferredMax !== "" && r.amount > deferredMax) return false;
      if (needle && !r.businessName.toLowerCase().includes(needle)) return false;
      return true;
    });
    const total = filtered.reduce((s, r) => s + r.amount, 0);
    return { filtered, total };
  }, [rows, cat, kind, deferredMin, deferredMax, deferredQ]);

  const activeFilters =
    Number(cat !== "all") +
    Number(kind !== "all") +
    Number(amountMin !== "") +
    Number(amountMax !== "");

  // Rendered twice — inline on sm+ and inside the mobile filter popover.
  // Both share the same state, so no syncing is needed.
  function renderFilterControls(layout: "xs" | "sm") {
    return (
      <>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className={layout === "sm" ? "w-44" : "w-full"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.transactions.allCategories}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
          <SelectTrigger className={layout === "sm" ? "w-36" : "w-full"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.transactions.allTypes}</SelectItem>
            <SelectItem value="VARIABLE">{t.transactions.variable}</SelectItem>
            <SelectItem value="FIXED">{t.transactions.fixed}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <MoneyInput
            value={amountMin}
            onValueChange={setAmountMin}
            placeholder={t.transactions.amountFrom}
            className={layout === "sm" ? "w-32" : "flex-1"}
          />
          <MoneyInput
            value={amountMax}
            onValueChange={setAmountMax}
            placeholder={t.transactions.amountTo}
            className={layout === "sm" ? "w-32" : "flex-1"}
          />
        </div>
      </>
    );
  }

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

  return (
    // Fill <main>'s height: the table scrolls internally so the count/total
    // footer at the bottom of the card is always visible.
    // Fit the viewport exactly so the table scrolls internally and the totals
    // row stays visible. Derived from the shell: topbar h-16 + border (1px)
    // + <main> py-6 (3rem) — the layout wrapper is min-h-full (auto height),
    // so flex-1/h-full can't provide a definite height here.
    <div className="flex h-[calc(100dvh-7rem-1px)] min-h-0 flex-col gap-3 sm:gap-6">
      {/* Month/year picker at the start; action buttons at the end. On
          mobile the secondary actions collapse into a ⋯ menu. */}
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
          <Button onClick={openAdd}>
            <Plus /> {t.transactions.add}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-surface"
                aria-label={t.common.more}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setImportOpen(true)}>
                <Upload className="size-4" /> {t.nav.import}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search stays inline everywhere; the remaining filters are inline on
          sm+ and collapse into a popover on mobile. */}
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
          {renderFilterControls("sm")}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="bg-surface sm:hidden"
              aria-label={t.common.filters}
            >
              <SlidersHorizontal />
              {activeFilters > 0 && (
                <Badge variant="primary">{activeFilters}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="flex flex-col gap-3">
            {renderFilterControls("xs")}
          </PopoverContent>
        </Popover>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={t.transactions.empty}
          action={
            <Button onClick={openAdd} variant="outline">
              <Plus /> {t.transactions.add}
            </Button>
          }
        />
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Table containerClassName="min-h-0 flex-1 overflow-y-auto">
            <TableHeader className="sticky top-0 z-10 bg-surface shadow-divider">
              <TableRow>
                <TableHead className="w-28">{t.transactions.date}</TableHead>
                <TableHead>{t.transactions.business}</TableHead>
                <TableHead>{t.common.category}</TableHead>
                <TableHead className="w-24">{t.transactions.kind}</TableHead>
                <TableHead className="w-32 text-end">{t.common.amount}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="tnum text-muted-foreground">
                    {formatDate(r.date)}
                  </TableCell>
                  <TableCell className="font-medium">{r.businessName}</TableCell>
                  <TableCell>{r.categoryName}</TableCell>
                  <TableCell>
                    <Badge variant={r.kind === "FIXED" ? "primary" : "default"}>
                      {r.kind === "FIXED"
                        ? t.transactions.fixed
                        : t.transactions.variable}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-end tnum font-medium",
                      r.amount < 0 && "text-success",
                    )}
                  >
                    {formatMoney(r.amount, { decimals: true })}
                  </TableCell>
                  <TableCell>
                    <RowActions>
                      <IconButton label={t.common.edit} onClick={() => openEdit(r)}>
                        <Pencil />
                      </IconButton>
                      <IconButton
                        label={t.common.delete}
                        onClick={() => setToDelete(r)}
                      >
                        <Trash2 />
                      </IconButton>
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex shrink-0 items-center justify-between border-t border-border bg-surface-muted/50 px-4 py-3 text-sm font-semibold">
            <span>
              {filtered.length} {t.transactions.count}
            </span>
            <span className="tnum">
              {t.common.total}: {formatMoney(total, { decimals: true })}
            </span>
          </div>
        </Card>
      )}

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        categories={categories}
        year={year}
        month={month}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t.transactions.deleteConfirm}
        description={toDelete?.businessName}
        onConfirm={handleDelete}
        loading={pending}
      />
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}
