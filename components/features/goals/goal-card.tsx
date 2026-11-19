"use client";

import * as React from "react";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, formatPercent, cn } from "@/lib/utils";
import { toggleMilestone } from "@/app/actions/goals";
import { EditDeleteActions } from "@/components/shared/edit-delete-actions";
import { IconButton } from "@/components/shared/icon-button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu } from "@/components/ui/dropdown-menu/DropdownMenu";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Goal } from "./types";

export function GoalCard({
  goal: g,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const [, startTransition] = React.useTransition();

  const pct =
    g.type === "NUMERIC"
      ? g.target && g.target > 0
        ? Math.min(100, (g.current / g.target) * 100)
        : 0
      : g.milestones.length > 0
        ? (g.milestones.filter((m) => m.done).length / g.milestones.length) * 100
        : 0;
  const done = pct >= 100;

  return (
    <Card className="group/row flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{g.title}</span>
              {done && <Badge variant="success">{t.goals.completed}</Badge>}
            </div>
            {g.note && (
              <span className="text-sm text-muted-foreground">{g.note}</span>
            )}
          </div>
          <EditDeleteActions
            className="hidden shrink-0 sm:flex"
            onEdit={onEdit}
            onDelete={onDelete}
          />
          <DropdownMenu
            align="end"
            trigger={
              <IconButton
                label={t.common.more}
                className="-me-2 -mt-2 shrink-0 sm:hidden"
              >
                <EllipsisVertical />
              </IconButton>
            }
            items={[
              {
                label: t.common.edit,
                icon: <Pencil className="size-4" />,
                onSelect: onEdit,
              },
              { kind: "separator" },
              {
                label: t.common.delete,
                icon: <Trash2 className="size-4" />,
                variant: "danger",
                onSelect: onDelete,
              },
            ]}
          />
        </div>

        {g.type === "NUMERIC" ? (
          <div className="mt-auto flex flex-col gap-2">
            <div className="flex items-baseline justify-between tnum">
              <span className="text-lg font-semibold">{formatMoney(g.current)}</span>
              <span className="text-sm text-muted-foreground">
                / {formatMoney(g.target ?? 0)}
              </span>
            </div>
            <Progress
              value={pct}
              indicatorClassName={done ? "bg-success" : undefined}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatPercent(pct / 100)}</span>
              {g.linkCategoryName && <span>· {g.linkCategoryName}</span>}
              {g.linkKind === "INVESTMENT_TOTAL" && (
                <span>· {t.goals.linkInvestment}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Progress
              value={pct}
              indicatorClassName={done ? "bg-success" : undefined}
            />
            <ul className="flex flex-col gap-1.5">
              {g.milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={m.done}
                    onCheckedChange={(v) =>
                      startTransition(async () => {
                        await toggleMilestone(m.id, !!v);
                      })
                    }
                  />
                  <span
                    className={cn(
                      "text-sm",
                      m.done && "text-muted-foreground line-through",
                    )}
                  >
                    {m.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
