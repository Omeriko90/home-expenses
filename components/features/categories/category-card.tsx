"use client";

import { Pencil, Trash2, Archive, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, cn } from "@/lib/utils";
import { IconButton } from "@/components/shared/icon-button";
import { RowActions } from "@/components/shared/row-actions";
import { Card } from "@/components/ui/card";
import type { Category } from "./category-manager";

export function CategoryCard({
  category: c,
  className,
  onEdit,
  onToggleArchive,
  onDelete,
}: {
  category: Category;
  className?: string;
  onEdit: (c: Category) => void;
  onToggleArchive: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  const { t } = useI18n();
  return (
    <Card
      className={cn(
        "group/row flex items-start justify-between gap-2 p-4",
        className,
      )}
    >
      <div className="min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2.5 shrink-0 rounded-full",
              !c.color && "border border-border-strong",
            )}
            style={c.color ? { backgroundColor: c.color } : undefined}
          />
          <span className="font-medium truncate">{c.name}</span>
        </div>
        {c.description && (
          <span className="text-sm text-muted-foreground truncate">
            {c.description}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {c.txCount} {t.nav.transactions}
          {c.yearSpend > 0 && (
            <> · {formatMoney(c.yearSpend)} {t.summary.thisYear}</>
          )}
        </span>
        <span className="text-xs text-muted-foreground">
          {c.lastUsed
            ? `${t.categories.lastUsed}: ${formatDate(c.lastUsed)}`
            : t.categories.neverUsed}
        </span>
      </div>
      <RowActions className="shrink-0">
        <IconButton label={t.common.edit} onClick={() => onEdit(c)}>
          <Pencil />
        </IconButton>
        <IconButton
          label={c.archived ? t.common.restore : t.common.archive}
          onClick={() => onToggleArchive(c)}
        >
          {c.archived ? <RotateCcw /> : <Archive />}
        </IconButton>
        <IconButton label={t.common.delete} onClick={() => onDelete(c)}>
          <Trash2 />
        </IconButton>
      </RowActions>
    </Card>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}
