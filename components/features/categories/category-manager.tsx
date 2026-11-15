"use client";

import * as React from "react";
import { Pencil, Plus, Trash2, Archive, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryArchived,
  type CategoryInput,
} from "@/app/actions/categories";
import { EmptyState } from "@/components/shared/empty-state";
import { Field } from "@/components/shared/field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { IconButton } from "@/components/shared/icon-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  archived: boolean;
  txCount: number;
};

export function CategoryManager({ initial }: { initial: Category[] }) {
  const { t } = useI18n();
  const [tab, setTab] = React.useState<"EXPENSE" | "INVESTMENT">("EXPENSE");
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<Category | null>(null);
  const [pending, startTransition] = React.useTransition();

  const list = initial.filter((c) => c.type === tab);

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

        {(["EXPENSE", "INVESTMENT"] as const).map((type) => (
          <TabsContent key={type} value={type}>
            {list.length === 0 ? (
              <EmptyState title={t.categories.empty} />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {initial
                  .filter((c) => c.type === type)
                  .map((c) => (
                    <Card
                      key={c.id}
                      className="flex items-start justify-between gap-2 p-4"
                    >
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{c.name}</span>
                          {c.archived && (
                            <Badge variant="warning">{t.common.archived}</Badge>
                          )}
                        </div>
                        {c.description && (
                          <span className="text-sm text-muted-foreground truncate">
                            {c.description}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {c.txCount} {t.nav.transactions}
                        </span>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <IconButton
                          label={t.common.edit}
                          onClick={() => openEdit(c)}
                        >
                          <Pencil />
                        </IconButton>
                        <IconButton
                          label={c.archived ? t.common.restore : t.common.archive}
                          onClick={() => toggleArchive(c)}
                        >
                          {c.archived ? <RotateCcw /> : <Archive />}
                        </IconButton>
                        <IconButton
                          label={t.common.delete}
                          onClick={() => setToDelete(c)}
                        >
                          <Trash2 />
                        </IconButton>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
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

  React.useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
    }
  }, [open, editing]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: CategoryInput = {
      name: name.trim(),
      description: description.trim() || null,
      type: editing?.type ?? defaultType,
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
