"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney } from "@/lib/utils";
import type { PortfolioSummary } from "@/lib/summary";
import { deleteHolding } from "@/app/actions/investments";
import type { AutocompleteOption } from "@/components/shared/autocomplete";
import { IconButton } from "@/components/shared/icon-button";
import { RowActions } from "@/components/shared/row-actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
          <Table containerClassName="max-h-[min(550px,100dvh)] overflow-y-auto">
            <TableHeader>
              <TableRow>
                <TableHead>{t.investments.instrument}</TableHead>
                <TableHead>{t.common.type}</TableHead>
                <TableHead>{t.investments.house}</TableHead>
                <TableHead>{t.investments.channel}</TableHead>
                <TableHead className="text-end">{t.investments.value}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.instrument}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {h.type || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{h.house}</TableCell>
                  <TableCell className="text-muted-foreground">{h.channel}</TableCell>
                  <TableCell className="text-end tnum">
                    {formatMoney(h.value)}
                  </TableCell>
                  <TableCell>
                    <RowActions>
                      <IconButton
                        label={t.common.edit}
                        onClick={() =>
                          setHoldingForm({ open: true, editing: h })
                        }
                      >
                        <Pencil />
                      </IconButton>
                      <IconButton
                        label={t.common.delete}
                        onClick={() => setToDelete(h)}
                      >
                        <Trash2 />
                      </IconButton>
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <HoldingForm
        open={holdingForm.open}
        onOpenChange={(o) => setHoldingForm((s) => ({ ...s, open: o }))}
        editing={holdingForm.editing}
        portfolioId={p.id}
        year={year}
        typeOptions={typeOptions}
      />
      <DepositsForm
        open={depositsOpen}
        onOpenChange={setDepositsOpen}
        portfolioId={p.id}
        year={year}
        current={p.deposits}
      />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t.investments.deleteConfirm}
        description={toDelete?.instrument}
        onConfirm={handleDelete}
        loading={pending}
      />
    </div>
  );
}
