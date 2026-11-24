import { useI18n } from "@/lib/i18n/context";
import { MoneyInput } from "@/components/shared/money-input";
import { MultiSelect } from "@/components/ui/multi-select/MultiSelect";
import { Select } from "@/components/ui/select/Select";
import type { TxCategory } from "./transaction-form";

export type TxKind = "all" | "FIXED" | "VARIABLE";

export function TransactionFilters({
  layout,
  categories,
  cats,
  onCatsChange,
  kind,
  onKindChange,
  amountMin,
  onAmountMinChange,
  amountMax,
  onAmountMaxChange,
}: {
  layout: "xs" | "sm";
  categories: TxCategory[];
  cats: string[];
  onCatsChange: (v: string[]) => void;
  kind: TxKind;
  onKindChange: (v: TxKind) => void;
  amountMin: number | "";
  onAmountMinChange: (v: number | "") => void;
  amountMax: number | "";
  onAmountMaxChange: (v: number | "") => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <MultiSelect
        values={cats}
        onValuesChange={onCatsChange}
        placeholder={t.transactions.allCategories}
        removeLabel={t.common.delete}
        className={layout === "sm" ? "w-56" : "w-full"}
        options={categories.map((c) => ({
          value: c.id,
          label: (
            <span className="flex items-center gap-1">
              {c.name}
              {c.archived && (
                <span className="text-xs text-muted-foreground">
                  ({t.common.archived})
                </span>
              )}
            </span>
          ),
        }))}
      />
      <Select
        value={kind}
        onValueChange={(v) => onKindChange(v as TxKind)}
        className={layout === "sm" ? "w-36" : "w-full"}
        options={[
          { value: "all", label: t.transactions.allTypes },
          { value: "VARIABLE", label: t.transactions.variable },
          { value: "FIXED", label: t.transactions.fixed },
        ]}
      />
      <div className="flex items-center gap-2">
        <MoneyInput
          value={amountMin}
          onValueChange={onAmountMinChange}
          placeholder={t.transactions.amountFrom}
          className={layout === "sm" ? "w-32" : "flex-1"}
        />
        <MoneyInput
          value={amountMax}
          onValueChange={onAmountMaxChange}
          placeholder={t.transactions.amountTo}
          className={layout === "sm" ? "w-32" : "flex-1"}
        />
      </div>
    </>
  );
}
