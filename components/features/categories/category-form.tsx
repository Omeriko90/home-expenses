"use client";

import { useMemo, useTransition } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { createCategory, updateCategory } from "@/app/actions/categories";
import {
  createCategoryFormSchema,
  type CategoryFormValues,
} from "@/lib/schemas/categories";
import { CHART_COLORS } from "@/components/shared/charts/chart-palette";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/shared/field";
import { useZodForm } from "@/components/ui/form/use-zod-form";
import { RhfFormDialog } from "@/components/ui/form/form-dialog";
import { TextField } from "@/components/ui/form/text-field";
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
  const [pending, startTransition] = useTransition();
  const schema = useMemo(() => createCategoryFormSchema(t), [t]);
  const methods = useZodForm(schema, {
    defaultValues: {
      name: editing?.name ?? "",
      description: editing?.description ?? "",
      color: editing?.color ?? null,
    },
  });

  function handleSubmit(values: CategoryFormValues) {
    const input = {
      name: values.name,
      description: values.description.trim() || null,
      type: editing?.type ?? defaultType,
      color: values.color,
    };
    startTransition(async () => {
      const res = editing
        ? await updateCategory(editing.id, input)
        : await createCategory(input);
      if ("error" in res && res.error === "duplicate") {
        methods.setError("name", {
          type: "server",
          message: t.categories.duplicate,
        });
        return;
      }
      toast.success(t.common.save);
      onClose();
    });
  }

  return (
    <RhfFormDialog
      open={open}
      onClose={onClose}
      title={editing ? t.categories.edit : t.categories.add}
      methods={methods}
      onSubmit={handleSubmit}
      pending={pending}
    >
      <TextField
        name="name"
        label={t.common.name}
        placeholder={t.categories.nameHint}
        autoFocus
        required
      />
      <TextField name="description" label={t.common.description} />
      <Controller
        name="color"
        control={methods.control}
        render={({ field }) => (
          <Field label={t.categories.color}>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                aria-label={t.categories.noColor}
                title={t.categories.noColor}
                onClick={() => field.onChange(null)}
                className={cn(
                  "h-6 w-6 rounded-full border-2 border-dashed border-border-strong p-0",
                  { "ring-2 ring-ring ring-offset-2": field.value === null },
                )}
              />
              {CHART_COLORS.map((hex) => (
                <Button
                  key={hex}
                  type="button"
                  variant="ghost"
                  aria-label={hex}
                  onClick={() => field.onChange(hex)}
                  className={cn(
                    "h-6 w-6 rounded-full p-0",
                    { "ring-2 ring-ring ring-offset-2": field.value === hex },
                  )}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </Field>
        )}
      />
    </RhfFormDialog>
  );
}
