"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { IconButton } from "@/components/shared/icon-button";
import { RowActions } from "@/components/shared/row-actions";

export function EditDeleteActions({
  onEdit,
  onDelete,
  className,
}: {
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <RowActions className={className}>
      <IconButton label={t.common.edit} onClick={onEdit}>
        <Pencil />
      </IconButton>
      <IconButton label={t.common.delete} onClick={onDelete}>
        <Trash2 />
      </IconButton>
    </RowActions>
  );
}
