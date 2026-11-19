"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  deleteCategory,
  setCategoryArchived,
} from "@/app/actions/categories";
import { CategoryCard } from "@/components/features/categories/category-card";
import { CategoryForm } from "@/components/features/categories/category-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion } from "@/components/ui/accordion/Accordion";

export type Category = {
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
                    <Accordion
                      items={[
                        {
                          value: "archived",
                          itemClassName: "border-b-0",
                          triggerClassName: "text-sm text-muted-foreground",
                          trigger: `${t.common.archived} (${archived.length})`,
                          content: (
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
                          ),
                        },
                      ]}
                    />
                  )}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {formOpen && (
        <CategoryForm
          open
          onClose={() => setFormOpen(false)}
          editing={editing}
          defaultType={tab}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          open
          onClose={() => setToDelete(null)}
          title={t.categories.deleteConfirm}
          description={toDelete.txCount > 0 ? t.categories.deleteWithTx : undefined}
          confirmLabel={toDelete.txCount > 0 ? t.common.archive : t.common.delete}
          onConfirm={handleDelete}
          loading={pending}
        />
      )}
    </div>
  );
}
