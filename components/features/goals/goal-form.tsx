"use client";

import * as React from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  createGoal,
  updateGoal,
  type GoalInput,
} from "@/app/actions/goals";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { MoneyInput } from "@/components/shared/money-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select/Select";
import type { Goal, GoalCategory } from "./types";

export function GoalForm({
  open,
  onClose,
  editing,
  categories,
  year,
}: {
  open: boolean;
  onClose: () => void;
  editing: Goal | null;
  categories: GoalCategory[];
  year: number;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();
  const [type, setType] = React.useState<"NUMERIC" | "CHECKLIST">(
    editing?.type ?? "NUMERIC",
  );
  const [title, setTitle] = React.useState(editing?.title ?? "");
  const [note, setNote] = React.useState(editing?.note ?? "");
  const [target, setTarget] = React.useState<number | "">(editing?.target ?? "");
  const [current, setCurrent] = React.useState<number | "">(
    editing?.current ?? "",
  );
  const [linkKind, setLinkKind] = React.useState<
    "NONE" | "CATEGORY" | "INVESTMENT_TOTAL"
  >(editing?.linkKind ?? "NONE");
  const [linkCategoryId, setLinkCategoryId] = React.useState<string>(
    editing?.linkCategoryId ?? "",
  );
  const [milestones, setMilestones] = React.useState<string>(
    editing?.milestones.map((m) => m.title).join("\n") ?? "",
  );

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
      onClose();
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={editing ? t.goals.edit : t.goals.add}
      onSubmit={submit}
      pending={pending}
    >
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
            options={[
              { value: "NUMERIC", label: t.goals.numeric },
              { value: "CHECKLIST", label: t.goals.checklist },
            ]}
          />
        </Field>
      )}

      {type === "NUMERIC" ? (
        <>
          <Field label={t.goals.linkTo}>
            <Select
              value={linkKind}
              onValueChange={(v) => setLinkKind(v as typeof linkKind)}
              options={[
                { value: "NONE", label: t.goals.linkNone },
                { value: "CATEGORY", label: t.goals.linkCategory },
                { value: "INVESTMENT_TOTAL", label: t.goals.linkInvestment },
              ]}
            />
          </Field>
          {linkKind === "CATEGORY" && (
            <Field label={t.goals.linkCategory}>
              <Select
                value={linkCategoryId || null}
                onValueChange={setLinkCategoryId}
                placeholder={t.common.category}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
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
    </FormDialog>
  );
}
