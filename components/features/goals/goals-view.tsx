"use client";

import * as React from "react";
import { Pencil, Plus, Trash2, Target } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, formatPercent, cn } from "@/lib/utils";
import {
  createGoal,
  updateGoal,
  deleteGoal,
  toggleMilestone,
  type GoalInput,
} from "@/app/actions/goals";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { YearSelect } from "@/components/shared/year-select";
import { IconButton } from "@/components/shared/icon-button";
import { RowActions } from "@/components/shared/row-actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/baseSelectComponents";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/baseDialogComponents";

type Milestone = { id: string; title: string; done: boolean };
type Goal = {
  id: string;
  title: string;
  type: "NUMERIC" | "CHECKLIST";
  note: string | null;
  target: number | null;
  current: number;
  linkKind: "NONE" | "CATEGORY" | "INVESTMENT_TOTAL";
  linkCategoryId: string | null;
  linkCategoryName: string | null;
  milestones: Milestone[];
};
type Category = { id: string; name: string };

export function GoalsView({
  year,
  years,
  goals,
  categories,
}: {
  year: number;
  years: number[];
  goals: Goal[];
  categories: Category[];
}) {
  const { t } = useI18n();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Goal | null>(null);
  const [toDelete, setToDelete] = React.useState<Goal | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      await deleteGoal(toDelete.id);
      toast.success(t.common.delete);
      setToDelete(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t.goals.title}
        actions={
          <div className="flex items-center gap-2">
            <YearSelect year={year} years={years} />
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> {t.goals.add}
            </Button>
          </div>
        }
      />

      {goals.length === 0 ? (
        <EmptyState icon={<Target />} title={t.goals.empty} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => {
                setEditing(g);
                setFormOpen(true);
              }}
              onDelete={() => setToDelete(g)}
            />
          ))}
        </div>
      )}

      <GoalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        categories={categories}
        year={year}
      />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t.goals.deleteConfirm}
        description={toDelete?.title}
        onConfirm={handleDelete}
        loading={pending}
      />
    </div>
  );
}

function GoalCard({
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
          <RowActions className="shrink-0">
            <IconButton label={t.common.edit} onClick={onEdit}>
              <Pencil />
            </IconButton>
            <IconButton label={t.common.delete} onClick={onDelete}>
              <Trash2 />
            </IconButton>
          </RowActions>
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

function GoalForm({
  open,
  onOpenChange,
  editing,
  categories,
  year,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Goal | null;
  categories: Category[];
  year: number;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();
  const [type, setType] = React.useState<"NUMERIC" | "CHECKLIST">("NUMERIC");
  const [title, setTitle] = React.useState("");
  const [note, setNote] = React.useState("");
  const [target, setTarget] = React.useState<number | "">("");
  const [current, setCurrent] = React.useState<number | "">("");
  const [linkKind, setLinkKind] = React.useState<
    "NONE" | "CATEGORY" | "INVESTMENT_TOTAL"
  >("NONE");
  const [linkCategoryId, setLinkCategoryId] = React.useState<string>("");
  const [milestones, setMilestones] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;
    setType(editing?.type ?? "NUMERIC");
    setTitle(editing?.title ?? "");
    setNote(editing?.note ?? "");
    setTarget(editing?.target ?? "");
    setCurrent(editing?.current ?? "");
    setLinkKind(editing?.linkKind ?? "NONE");
    setLinkCategoryId(editing?.linkCategoryId ?? "");
    setMilestones(editing?.milestones.map((m) => m.title).join("\n") ?? "");
  }, [open, editing]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t.common.noData);
      return;
    }
    const input: GoalInput = {
      title: title.trim(),
      year,
      type,
      note: note.trim() || null,
      targetAmount: type === "NUMERIC" ? Number(target || 0) : null,
      currentAmount:
        type === "NUMERIC" && linkKind === "NONE" ? Number(current || 0) : null,
      linkKind,
      linkCategoryId: linkKind === "CATEGORY" ? linkCategoryId : null,
      milestones:
        type === "CHECKLIST"
          ? milestones.split("\n").map((m) => m.trim()).filter(Boolean)
          : undefined,
    };
    startTransition(async () => {
      if (editing) await updateGoal(editing.id, input);
      else await createGoal(input);
      toast.success(t.common.save);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t.goals.edit : t.goals.add}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={t.common.name} htmlFor="g-title" required>
            <Input
              id="g-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Field>

          {!editing && (
            <Field label={t.common.type}>
              <Select
                value={type}
                onValueChange={(v) => setType(v as typeof type)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NUMERIC">{t.goals.numeric}</SelectItem>
                  <SelectItem value="CHECKLIST">{t.goals.checklist}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}

          {type === "NUMERIC" ? (
            <>
              <Field label={t.goals.linkTo}>
                <Select
                  value={linkKind}
                  onValueChange={(v) => setLinkKind(v as typeof linkKind)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">{t.goals.linkNone}</SelectItem>
                    <SelectItem value="CATEGORY">{t.goals.linkCategory}</SelectItem>
                    <SelectItem value="INVESTMENT_TOTAL">
                      {t.goals.linkInvestment}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {linkKind === "CATEGORY" && (
                <Field label={t.goals.linkCategory}>
                  <Select
                    value={linkCategoryId}
                    onValueChange={setLinkCategoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.common.category} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label={t.goals.target} required>
                  <MoneyInput value={target} onValueChange={setTarget} />
                </Field>
                {linkKind === "NONE" && (
                  <Field label={t.goals.current}>
                    <MoneyInput value={current} onValueChange={setCurrent} />
                  </Field>
                )}
              </div>
            </>
          ) : (
            <Field
              label={t.goals.milestone}
              htmlFor="g-ms"
              hint={t.goals.addMilestone}
            >
              <textarea
                id="g-ms"
                value={milestones}
                onChange={(e) => setMilestones(e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Field>
          )}

          <Field label={t.transactions.note} htmlFor="g-note">
            <Input
              id="g-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
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
