"use client";

import {
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  EllipsisVertical,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, cn } from "@/lib/utils";
import { IconButton } from "@/components/shared/icon-button";
import { Card } from "@/components/ui/card";
import { DropdownMenu } from "@/components/ui/dropdown-menu/DropdownMenu";
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
      className={cn("flex items-start justify-between gap-2 p-4", className)}
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
      <DropdownMenu
        align="end"
        trigger={
          <IconButton label={t.common.more} className="-me-2 -mt-2 shrink-0">
            <EllipsisVertical />
          </IconButton>
        }
        items={[
          {
            label: t.common.edit,
            icon: <Pencil className="size-4" />,
            onSelect: () => onEdit(c),
          },
          {
            label: c.archived ? t.common.restore : t.common.archive,
            icon: c.archived ? (
              <RotateCcw className="size-4" />
            ) : (
              <Archive className="size-4" />
            ),
            onSelect: () => onToggleArchive(c),
          },
          { kind: "separator" },
          {
            label: t.common.delete,
            icon: <Trash2 className="size-4" />,
            variant: "danger",
            onSelect: () => onDelete(c),
          },
        ]}
      />
    </Card>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}
