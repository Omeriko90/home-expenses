"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, cn } from "@/lib/utils";
import {
  parseImport,
  commitImport,
  type ParseResult,
  type CommitRow,
} from "@/app/actions/import";
import { Autocomplete } from "@/components/shared/autocomplete";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select/Select";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { StepIndicator, type Step } from "./step-indicator";
import { ColumnMap } from "./column-map";

type ReviewRow = {
  key: number;
  date: Date;
  businessName: string;
  amount: number;
  fileCategory: string | null;
  categoryId: string | null;
  kind: "FIXED" | "VARIABLE";
};

function normalizeBiz(s: string): string {
  return s.replace(/["'״׳,]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}
function parseAmount(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const c = v.replace(/[₪,\s]/g, "").replace(/[^\d.-]/g, "");
    return c ? Number(c) : null;
  }
  return null;
}
function excelToDate(raw: unknown, fallbackYear: number): Date {
  if (typeof raw === "number")
    return new Date(Date.UTC(1899, 11, 30) + raw * 86400000);
  if (typeof raw === "string") {
    const m = raw.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
    if (m) {
      const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
      return new Date(Date.UTC(year, Number(m[2]) - 1, Number(m[1])));
    }
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(Date.UTC(fallbackYear, 0, 1));
}
function suggestFor(
  res: ParseResult,
  business: string,
  fileCat: string | null,
): string | null {
  const key = normalizeBiz(business);
  const exact = res.mappings.find((m) => m.pattern === key);
  if (exact) return exact.categoryId;
  const contains = res.mappings.find(
    (m) => m.pattern.length > 2 && key.includes(m.pattern),
  );
  if (contains) return contains.categoryId;
  if (fileCat) {
    const c = res.categories.find(
      (c) => normalizeBiz(c.name) === normalizeBiz(fileCat),
    );
    if (c) return c.id;
  }
  return null;
}
function fmtDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

export function ImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("upload");
  const [parsing, startParse] = React.useTransition();
  const [committing, startCommit] = React.useTransition();
  const [result, setResult] = React.useState<ParseResult | null>(null);
  const [mapping, setMapping] = React.useState<ParseResult["mapping"] | null>(null);
  const [rows, setRows] = React.useState<ReviewRow[]>([]);

  const rebuildRows = React.useCallback(
    (res: ParseResult, map: ParseResult["mapping"]) => {
      const fallbackYear = new Date().getFullYear();
      const out: ReviewRow[] = [];
      res.grid.forEach((r, i) => {
        const business = String(r[map.businessCol] ?? "").trim();
        const amount = parseAmount(r[map.amountCol]);
        if (!business || amount === null) return;
        const fileCategory =
          map.categoryCol !== null
            ? String(r[map.categoryCol] ?? "").trim() || null
            : null;
        out.push({
          key: i,
          date: excelToDate(r[map.dateCol], fallbackYear),
          businessName: business,
          amount,
          fileCategory,
          categoryId: suggestFor(res, business, fileCategory),
          kind: "VARIABLE",
        });
      });
      setRows(out);
    },
    [],
  );

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    startParse(async () => {
      try {
        const res = await parseImport(fd);
        setResult(res);
        setMapping(res.mapping);
        rebuildRows(res, res.mapping);
        setStep("map");
      } catch {
        toast.error(t.common.noData);
      }
    });
  }

  function remap(patch: Partial<ParseResult["mapping"]>) {
    if (!result || !mapping) return;
    const next = { ...mapping, ...patch };
    setMapping(next);
    rebuildRows(result, next);
  }

  function commit() {
    const unassigned = rows.filter((r) => !r.categoryId);
    if (unassigned.length > 0) {
      toast.error(t.import.needCategory);
      return;
    }
    const payload: CommitRow[] = rows.map((r) => ({
      date: r.date.toISOString(),
      businessName: r.businessName,
      rawBusinessName: r.businessName,
      amount: r.amount,
      categoryId: r.categoryId!,
      kind: r.kind,
      rawFileCategory: r.fileCategory,
    }));
    startCommit(async () => {
      const res = await commitImport(payload);
      toast.success(t.import.imported.replace("{n}", String(res.created)));
      onClose();
      router.refresh();
    });
  }

  const catOptions =
    result?.categories.map((c) => ({ value: c.id, label: c.name })) ?? [];
  const columnOptions =
    result?.headerRow.map((h, i) => ({
      value: String(i),
      label: h || `#${i + 1}`,
    })) ?? [];
  const unassignedCount = rows.filter((r) => !r.categoryId).length;

  const previewColumns: TableColumn<ReviewRow>[] = [
    {
      header: t.transactions.date,
      cellClassName: "tnum text-muted-foreground",
      cell: (r) => fmtDate(r.date),
    },
    { header: t.transactions.business, cell: (r) => r.businessName },
    {
      header: t.common.amount,
      headClassName: "text-end",
      cellClassName: "text-end tnum",
      cell: (r) => formatMoney(r.amount, { decimals: true }),
    },
  ];

  const reviewColumns: TableColumn<ReviewRow>[] = [
    {
      header: t.transactions.date,
      headClassName: "w-24",
      cellClassName: "tnum text-muted-foreground",
      cell: (r) => fmtDate(r.date),
    },
    {
      header: t.transactions.business,
      cellClassName: "font-medium",
      cell: (r) => (
        <>
          {r.businessName}
          {r.fileCategory && (
            <span className="block text-xs text-muted-foreground">
              {r.fileCategory}
            </span>
          )}
        </>
      ),
    },
    {
      header: t.common.amount,
      headClassName: "text-end",
      cellClassName: "text-end tnum",
      cell: (r) => formatMoney(r.amount, { decimals: true }),
    },
    {
      header: t.common.category,
      headClassName: "w-52",
      cell: (r, idx) => (
        <Autocomplete
          options={catOptions}
          value={r.categoryId}
          onChange={(v) =>
            setRows((prev) =>
              prev.map((x, i) => (i === idx ? { ...x, categoryId: v } : x)),
            )
          }
          placeholder={t.import.unassigned}
        />
      ),
    },
    {
      header: t.transactions.kind,
      headClassName: "w-28",
      cell: (r, idx) => (
        <Select
          value={r.kind}
          onValueChange={(v) =>
            setRows((prev) =>
              prev.map((x, i) =>
                i === idx ? { ...x, kind: v as "FIXED" | "VARIABLE" } : x,
              ),
            )
          }
          className="h-9"
          options={[
            { value: "VARIABLE", label: t.transactions.variable },
            { value: "FIXED", label: t.transactions.fixed },
          ]}
        />
      ),
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t.import.title}
      description={<StepIndicator step={step} />}
      contentClassName={cn(
        "max-h-[90dvh] overflow-hidden flex flex-col",
        step === "review" ? "max-w-4xl" : "max-w-lg",
      )}
      footerClassName="flex-row justify-between sm:justify-between"
      footer={
        <>
          {step === "upload" ? (
            <span />
          ) : (
            <Button
              variant="outline"
              onClick={() => setStep(step === "review" ? "map" : "upload")}
            >
              <ArrowLeft className="rtl:rotate-180" /> {t.import.back}
            </Button>
          )}
          {step === "map" && (
            <Button onClick={() => setStep("review")} disabled={rows.length === 0}>
              {t.import.review} <ArrowRight className="rtl:rotate-180" />
            </Button>
          )}
          {step === "review" && (
            <Button onClick={commit} disabled={committing || rows.length === 0}>
              <Check /> {t.import.commit}
            </Button>
          )}
        </>
      }
    >
      {step === "upload" && (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border px-6 py-14 text-center transition-colors hover:border-primary/50 hover:bg-surface-muted/40">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary-tint text-primary">
            <Upload className="size-6" />
          </div>
          <span className="font-medium">
            {parsing ? t.import.parsing : t.import.dropHint}
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={onFile}
            disabled={parsing}
          />
        </label>
      )}

      {step === "map" && result && mapping && (
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center gap-2">
            <Badge variant="primary">
              <FileSpreadsheet className="size-3.5" /> {result.provider}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {rows.length} {t.import.rowsFound}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ColumnMap
              label={t.import.colDate}
              value={String(mapping.dateCol)}
              options={columnOptions}
              onChange={(v) => remap({ dateCol: Number(v) })}
            />
            <ColumnMap
              label={t.import.colBusiness}
              value={String(mapping.businessCol)}
              options={columnOptions}
              onChange={(v) => remap({ businessCol: Number(v) })}
            />
            <ColumnMap
              label={t.import.colAmount}
              value={String(mapping.amountCol)}
              options={columnOptions}
              onChange={(v) => remap({ amountCol: Number(v) })}
            />
            <ColumnMap
              label={t.import.colCategory}
              value={
                mapping.categoryCol === null
                  ? "none"
                  : String(mapping.categoryCol)
              }
              options={[{ value: "none", label: t.import.none }, ...columnOptions]}
              onChange={(v) =>
                remap({ categoryCol: v === "none" ? null : Number(v) })
              }
            />
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table
              columns={previewColumns}
              data={rows.slice(0, 4)}
              rowKey={(r) => r.key}
            />
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="flex flex-col gap-3 overflow-hidden">
          {unassignedCount > 0 && (
            <p className="text-sm text-warning">
              {unassignedCount} · {t.import.needCategory}
            </p>
          )}
          <div className="overflow-y-auto rounded-lg border border-border">
            <Table
              columns={reviewColumns}
              data={rows}
              rowKey={(r) => r.key}
              containerClassName="max-h-[55dvh] overflow-y-auto"
              headerClassName="sticky top-0 z-10 bg-surface shadow-divider"
              rowClassName={(r) => cn(!r.categoryId && "bg-warning/5")}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
