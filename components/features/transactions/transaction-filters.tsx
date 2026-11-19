import { useI18n } from "@/lib/i18n/context";
import { MoneyInput } from "@/components/shared/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TxCategory } from "./transaction-form";

export type TxKind = "all" | "FIXED" | "VARIABLE";

export function TransactionFilters({
  layout,
  categories,
  cat,
  onCatChange,
  kind,
  onKindChange,
  amountMin,
  onAmountMinChange,
  amountMax,
  onAmountMaxChange,
}: {
  layout: "xs" | "sm";
  categories: TxCategory[];
  cat: string;
  onCatChange: (v: string) => void;
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
      <Select value={cat} onValueChange={onCatChange}>
        <SelectTrigger className={layout === "sm" ? "w-44" : "w-full"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.transactions.allCategories}</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={kind} onValueChange={(v) => onKindChange(v as TxKind)}>
        <SelectTrigger className={layout === "sm" ? "w-36" : "w-full"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.transactions.allTypes}</SelectItem>
          <SelectItem value="VARIABLE">{t.transactions.variable}</SelectItem>
          <SelectItem value="FIXED">{t.transactions.fixed}</SelectItem>
        </SelectContent>
      </Select>
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
