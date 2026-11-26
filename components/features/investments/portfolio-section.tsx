"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import type { PortfolioSummary } from "@/lib/summary";
import { deleteHolding, deleteDeposit } from "@/app/actions/investments";
import type { AutocompleteOption } from "@/components/shared/autocomplete";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EditDeleteActions } from "@/components/shared/edit-delete-actions";
import { TotalsFooterRow } from "@/components/shared/totals-footer-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  TransactionForm,
  type TxRow,
  type TxCategory,
} from "@/components/features/transactions/transaction-form";
import { HoldingForm, type Holding } from "./holding-form";
import { HoldingsAccordion } from "./holdings-accordion";

export function PortfolioSection({
  portfolio: p,
  year,
  typeFilter,
  typeOptions,
  investmentCategories,
  deposits,
}: {
  portfolio: PortfolioSummary;
  year: number;
  typeFilter: string | null;
  typeOptions: AutocompleteOption[];
  investmentCategories: TxCategory[];
  deposits: TxRow[];
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
  const [depositForm, setDepositForm] = React.useState<{
    open: boolean;
    editing: TxRow | null;
  }>({ open: false, editing: null });
  const [depositToDelete, setDepositToDelete] = React.useState<TxRow | null>(
    null,
  );
  const [tab, setTab] = React.useState<"holdings" | "deposits">("holdings");
  const [pending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      await deleteHolding(toDelete.id);
      toast.success(t.common.delete);
      setToDelete(null);
    });
  }

  function handleDeleteDeposit() {
    if (!depositToDelete) return;
    startTransition(async () => {
      await deleteDeposit(depositToDelete.id);
      toast.success(t.common.delete);
      setDepositToDelete(null);
    });
  }

  const depositsTotal = deposits.reduce((sum, d) => sum + d.amount, 0);

  const depositColumns: TableColumn<TxRow>[] = [
    {
      header: t.transactions.date,
      headClassName: "w-28",
      cellClassName: "text-muted-foreground",
      cell: (r) => `${t.months[r.month - 1]} ${new Date(r.date).getUTCFullYear()}`,
    },
    {
      header: t.investments.depositSource,
      cellClassName: "font-medium",
      cell: (r) => r.businessName,
    },
    { header: t.common.category, cell: (r) => r.categoryName },
    {
      header: t.common.amount,
      headClassName: "w-32 text-end",
      cellClassName: "text-end tnum font-medium",
      cell: (r) => formatMoney(r.amount, { decimals: true }),
    },
    {
      headClassName: "w-20",
      cell: (r) => (
        <EditDeleteActions
          onEdit={() => setDepositForm({ open: true, editing: r })}
          onDelete={() => setDepositToDelete(r)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{p.name}</h2>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="holdings">
              {t.investments.holdings}
            </TabsTrigger>
            <TabsTrigger value="deposits">
              {t.investments.deposits}
            </TabsTrigger>
          </TabsList>
          {tab === "holdings" ? (
            <Button
              size="sm"
              onClick={() => setHoldingForm({ open: true, editing: null })}
            >
              <Plus /> {t.investments.addHolding}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setDepositForm({ open: true, editing: null })}
            >
              <Plus /> {t.investments.addDeposit}
            </Button>
          )}
        </div>

        <TabsContent value="holdings" className="mt-3">
          {holdings.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-sm text-muted-foreground">
                  {t.investments.empty}
                </p>
              </CardContent>
            </Card>
          ) : (
            <HoldingsAccordion
              holdings={holdings}
              onEdit={(h) => setHoldingForm({ open: true, editing: h })}
              onDelete={setToDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="deposits" className="mt-3">
          {deposits.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-sm text-muted-foreground">
                  {t.investments.noDeposits}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <Table
                columns={depositColumns}
                data={deposits}
                rowKey={(r) => r.id}
              />
              <TotalsFooterRow>
                <span className="text-muted-foreground">
                  {deposits.length} {t.investments.deposits}
                </span>
                <span className="tnum">
                  {formatMoney(depositsTotal, { decimals: true })}
                </span>
              </TotalsFooterRow>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
      {depositForm.open && (
        <TransactionForm
          open
          mode="deposit"
          portfolioId={p.id}
          onClose={() => setDepositForm((s) => ({ ...s, open: false }))}
          editing={depositForm.editing}
          categories={investmentCategories}
          year={year}
          month={depositForm.editing?.month ?? 1}
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
      {depositToDelete && (
        <ConfirmDialog
          open
          onClose={() => setDepositToDelete(null)}
          title={t.investments.deleteDepositConfirm}
          description={depositToDelete.businessName}
          onConfirm={handleDeleteDeposit}
          loading={pending}
        />
      )}
    </div>
  );
}
