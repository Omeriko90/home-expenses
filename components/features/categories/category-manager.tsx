"use client";

import * as React from "react";
import { Pencil, Plus, Trash2, Archive, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { formatMoney, cn } from "@/lib/utils";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryArchived,
  type CategoryInput,
} from "@/app/actions/categories";
import { CHART_COLORS } from "@/components/shared/charts/chart-palette";
import { EmptyState } from "@/components/shared/empty-state";
import { Field } from "@/components/shared/field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { IconButton } from "@/components/shared/icon-button";
import { RowActions } from "@/components/shared/row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Category = {
  id: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  type: "EXPENSE" | "INVESTMENT";
  color: string | null;
  archived: boolean;
  txCount: number;
  yearSpend: number;
  lastUsed: string | null;
};

export function CategoryManager({ initial }: { initial: Category[] }) {
  const { t } = useI18n();
  const [tab, setTab] = React.useState<"EXPENSE" | "INVESTMENT">("EXPENSE");
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<Category | null>(null);
  const [pending, startTransition] = React.useTransition();

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(c: Category) {
    setEditing(c);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteCategory(toDelete.id);
      if ("archived" in res) toast.success(t.common.archive);
      else toast.success(t.common.delete);
      setToDelete(null);
    });
  }

  function toggleArchive(c: Category) {
    startTransition(async () => {
      await setCategoryArchived(c.id, !c.archived);
      toast.success(c.archived ? t.common.restore : t.common.archive);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        {/* Tabs at the start, Add button at the end of the same row. */}
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="EXPENSE">
              {t.categories.expenseCategories}
            </TabsTrigger>
            <TabsTrigger value="INVESTMENT">
              {t.categories.investmentCategories}
            </TabsTrigger>
          </TabsList>
          <Button onClick={openAdd}>
            <Plus /> {t.categories.add}
          </Button>
        </div>

        {(["EXPENSE", "INVESTMENT"] as const).map((type) => {
          const ofType = initial.filter((c) => c.type === type);
          const active = ofType.filter((c) => !c.archived);
          const archived = ofType.filter((c) => c.archived);
          return (
            <TabsContent key={type} value={type}>
              {ofType.length === 0 ? (
                <EmptyState title={t.categories.empty} />
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {active.map((c) => (
                      <CategoryCard
                        key={c.id}
                        category={c}
                        onEdit={openEdit}
                        onToggleArchive={toggleArchive}
                        onDelete={setToDelete}
                      />
                    ))}
                  </div>
                  {archived.length > 0 && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="archived" className="border-b-0">
                        <AccordionTrigger className="text-sm text-muted-foreground">
                          {t.common.archived} ({archived.length})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {archived.map((c) => (
                              <CategoryCard
                                key={c.id}
                                category={c}
                                className="opacity-60"
                                onEdit={openEdit}
                                onToggleArchive={toggleArchive}
                                onDelete={setToDelete}
                              />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        defaultType={tab}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t.categories.deleteConfirm}
        description={
          toDelete && toDelete.txCount > 0 ? t.categories.deleteWithTx : undefined
        }
        confirmLabel={
          toDelete && toDelete.txCount > 0 ? t.common.archive : t.common.delete
        }
        onConfirm={handleDelete}
        loading={pending}
      />
    </div>
  );
}

function CategoryCard({
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

function CategoryForm({
  open,
  onOpenChange,
  editing,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Category | null;
  defaultType: "EXPENSE" | "INVESTMENT";
}) {
  const { t } = useI18n();
  const [pending, startTransition] = React.useTransition();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
      setColor(editing?.color ?? null);
    }
  }, [open, editing]);

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
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? t.categories.edit : t.categories.add}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
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
            {/* Swatches reuse the chart palette so the picked color matches
                the charts exactly. */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-label={t.categories.noColor}
                title={t.categories.noColor}
                onClick={() => setColor(null)}
                className={cn(
                  "size-6 rounded-full border-2 border-dashed border-border-strong",
                  color === null && "ring-2 ring-ring ring-offset-2",
                )}
              />
              {CHART_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={hex}
                  onClick={() => setColor(hex)}
                  className={cn(
                    "size-6 rounded-full",
                    color === hex && "ring-2 ring-ring ring-offset-2",
                  )}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
