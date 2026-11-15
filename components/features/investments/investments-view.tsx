"use client";

import * as React from "react";
import { Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, formatPercent } from "@/lib/utils";
import type { PortfolioSummary } from "@/lib/summary";
import {
  upsertHolding,
  deleteHolding,
  upsertDeposits,
} from "@/app/actions/investments";
import { EmptyState } from "@/components/shared/empty-state";
import { YearSelect } from "@/components/shared/year-select";
import { StatCard, ChangeIndicator } from "@/components/shared/stat-card";
import { IconButton } from "@/components/shared/icon-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Holding = PortfolioSummary["holdings"][number];

export function InvestmentsView({
  year,
  years,
  portfolios,
}: {
  year: number;
  years: number[];
  portfolios: PortfolioSummary[];
}) {
  const { t } = useI18n();
  const [tab, setTab] = React.useState<"MAIN" | "KIDS">("MAIN");

  const main = portfolios.filter((p) => p.group === "MAIN");
  const kids = portfolios.filter((p) => p.group === "KIDS");

  if (portfolios.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-end">
          <YearSelect year={year} years={years} />
        </div>
        <EmptyState icon={<TrendingUp />} title={t.investments.empty} />
      </div>
    );
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
      <div className="flex items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="MAIN">{t.investments.main}</TabsTrigger>
          <TabsTrigger value="KIDS">{t.investments.kids}</TabsTrigger>
        </TabsList>
        <YearSelect year={year} years={years} />
      </div>
      <TabsContent value="MAIN" className="flex flex-col gap-6">
        {main.length === 0 ? (
          <EmptyState icon={<TrendingUp />} title={t.investments.empty} />
        ) : (
          main.map((p) => (
            <PortfolioSection key={p.id} portfolio={p} year={year} />
          ))
        )}
      </TabsContent>
      <TabsContent value="KIDS" className="flex flex-col gap-6">
        {kids.length === 0 ? (
          <EmptyState icon={<TrendingUp />} title={t.investments.empty} />
        ) : (
          kids.map((p) => (
            <PortfolioSection key={p.id} portfolio={p} year={year} />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

function PortfolioSection({
  portfolio: p,
  year,
}: {
  portfolio: PortfolioSummary;
  year: number;
}) {
  const { t } = useI18n();
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t.investments.currentValue}
          value={formatMoney(p.value)}
          accent="investment"
        />
        <StatCard label={t.investments.deposits} value={formatMoney(p.deposits)} />
        <StatCard
          label={t.investments.changeYoy}
          value={formatMoney(p.change, { sign: true })}
          accent="investment"
          sub={<ChangeIndicator amount={p.change} pct={p.changePct} mode="percent" />}
        />
        <StatCard
          label={t.investments.return}
          value={p.returnPct === null ? "—" : formatPercent(p.returnPct, { sign: true })}
          accent="investment"
        />
      </div>

      <Card className="overflow-hidden">
        {p.holdings.length === 0 ? (
          <CardContent className="py-8">
            <p className="text-center text-sm text-muted-foreground">
              {t.investments.empty}
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.investments.instrument}</TableHead>
                <TableHead>{t.investments.house}</TableHead>
                <TableHead>{t.investments.channel}</TableHead>
                <TableHead className="text-end">{t.investments.value}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {p.holdings.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.instrument}</TableCell>
                  <TableCell className="text-muted-foreground">{h.house}</TableCell>
                  <TableCell className="text-muted-foreground">{h.channel}</TableCell>
                  <TableCell className="text-end tnum">
                    {formatMoney(h.value)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
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
                    </div>
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

function HoldingForm({
  open,
  onOpenChange,
  editing,
  portfolioId,
  year,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Holding | null;
  portfolioId: string;
  year: number;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();
  const [instrument, setInstrument] = React.useState("");
  const [house, setHouse] = React.useState("");
  const [channel, setChannel] = React.useState("");
  const [value, setValue] = React.useState<number | "">("");

  React.useEffect(() => {
    if (!open) return;
    setInstrument(editing?.instrument ?? "");
    setHouse(editing?.house ?? "");
    setChannel(editing?.channel ?? "");
    setValue(editing?.value ?? "");
  }, [open, editing]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!instrument.trim() || value === "") {
      toast.error(t.common.noData);
      return;
    }
    startTransition(async () => {
      await upsertHolding({
        portfolioId,
        holdingId: editing?.id ?? null,
        instrument: instrument.trim(),
        house: house.trim(),
        channel: channel.trim(),
        year,
        value: Number(value),
      });
      toast.success(t.common.save);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? t.investments.editHolding : t.investments.addHolding}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={t.investments.instrument} htmlFor="h-inst" required>
            <Input
              id="h-inst"
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.investments.house} htmlFor="h-house">
              <Input
                id="h-house"
                value={house}
                onChange={(e) => setHouse(e.target.value)}
              />
            </Field>
            <Field label={t.investments.channel} htmlFor="h-chan">
              <Input
                id="h-chan"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              />
            </Field>
          </div>
          <Field label={`${t.investments.value} (${year})`} required>
            <MoneyInput value={value} onValueChange={setValue} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DepositsForm({
  open,
  onOpenChange,
  portfolioId,
  year,
  current,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  portfolioId: string;
  year: number;
  current: number;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState<number | "">(current || "");

  React.useEffect(() => {
    if (open) setValue(current || "");
  }, [open, current]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await upsertDeposits(portfolioId, year, typeof value === "number" ? value : 0);
      toast.success(t.common.save);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {t.investments.setDeposits} ({year})
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={t.investments.deposits} required>
            <MoneyInput value={value} onValueChange={setValue} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
