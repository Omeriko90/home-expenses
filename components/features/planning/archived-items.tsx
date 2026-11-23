"use client";

import { useState } from "react";
import { ChevronDown, RotateCcw, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/shared/icon-button";
import {
  formatMonthKey,
  PlannedItemStatuses,
  type ArchivedItem,
} from "./types";

export function ArchivedItems({
  items,
  onRestore,
  onDelete,
}: {
  items: ArchivedItem[];
  onRestore: (item: ArchivedItem) => void;
  onDelete: (item: ArchivedItem) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <Button
        variant="ghost"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="w-full justify-between rounded-none px-4 py-3 font-medium text-muted-foreground hover:text-foreground"
      >
        <span>
          {t.planning.archivedItems} ({items.length})
        </span>
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </Button>
      {open && (
        <div className="divide-y divide-border border-t border-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 opacity-70">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium line-through">
                    {item.title}
                  </span>
                  <Badge
                    variant={
                      item.status === PlannedItemStatuses.Done
                        ? "success"
                        : "default"
                    }
                  >
                    {item.status === PlannedItemStatuses.Done
                      ? t.planning.done
                      : t.planning.cancelled}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground tnum">
                  {formatMoney(item.amount)} ·{" "}
                  {formatMonthKey(item.startYear, item.startMonth)}
                </span>
              </div>
              <IconButton
                label={t.planning.restore}
                onClick={() => onRestore(item)}
              >
                <RotateCcw />
              </IconButton>
              <IconButton
                label={t.common.delete}
                onClick={() => onDelete(item)}
              >
                <Trash2 />
              </IconButton>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
