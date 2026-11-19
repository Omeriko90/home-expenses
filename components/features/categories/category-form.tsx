"use client";

import * as React from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import {
  createCategory,
  updateCategory,
  type CategoryInput,
} from "@/app/actions/categories";
import { CHART_COLORS } from "@/components/shared/charts/chart-palette";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import type { Category } from "./category-manager";

export function CategoryForm({
  open,
  onClose,
  editing,
  defaultType,
}: {
  open: boolean;
  onClose: () => void;
  editing: Category | null;
  defaultType: "EXPENSE" | "INVESTMENT";
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();
  const [name, setName] = React.useState(editing?.name ?? "");
  const [description, setDescription] = React.useState(
    editing?.description ?? "",
  );
  const [color, setColor] = React.useState<string | null>(editing?.color ?? null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: CategoryInput = {
      name: name.trim(),
      description: description.trim() || null,
      type: editing?.type ?? defaultType,
      color,
    };
    if (!input.name) return;
    startTransition(async () => {
      const res = editing
        ? await updateCategory(editing.id, input)
        : await createCategory(input);
      if ("error" in res && res.error === "duplicate") {
        toast.error(t.categories.duplicate);
        return;
      }
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={editing ? t.categories.edit : t.categories.add}
      onSubmit={submit}
      pending={pending}
    >
      <Field label={t.common.name} htmlFor="cat-name" required>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.categories.nameHint}
          autoFocus
          required
        />
      </Field>
      <Field label={t.common.description} htmlFor="cat-desc">
        <Input
          id="cat-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label={t.categories.color}>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            aria-label={t.categories.noColor}
            title={t.categories.noColor}
            onClick={() => setColor(null)}
            className={cn(
              "h-6 w-6 rounded-full border-2 border-dashed border-border-strong p-0",
              color === null && "ring-2 ring-ring ring-offset-2",
            )}
          />
          {CHART_COLORS.map((hex) => (
            <Button
              key={hex}
              type="button"
              variant="ghost"
              aria-label={hex}
              onClick={() => setColor(hex)}
              className={cn(
                "h-6 w-6 rounded-full p-0",
                color === hex && "ring-2 ring-ring ring-offset-2",
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </Field>
    </FormDialog>
  );
}
