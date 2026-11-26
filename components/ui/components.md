# UI Component Registry

Shadcn-style primitives (Radix UI + Tailwind + `cn()`). Import from the exact path listed — there are no barrel files.

## Folder components (base primitives + reusable wrapper)

These follow the `baseXxxComponents.tsx` + `Xxx.tsx` structure: the base file holds the raw shadcn/Radix declarations, the PascalCase file is the prop-driven wrapper used at call sites. New call sites use the wrapper; reach for the base primitives only when building a new wrapper-level component.

| Component | Wrapper import | Base primitives import | Radix dependency |
| --- | --- | --- | --- |
| Select | `@/components/ui/select/Select` | `@/components/ui/select/baseSelectComponents` | `@radix-ui/react-select` |
| MultiSelect | `@/components/ui/multi-select/MultiSelect` | — (composes Popover + ChipGroup) | `@radix-ui/react-popover` |
| ChipGroup | `@/components/ui/chip-group/ChipGroup` | `@/components/ui/chip-group/Chip` | — |
| Accordion | `@/components/ui/accordion/Accordion` | `@/components/ui/accordion/baseAccordionComponents` | `@radix-ui/react-accordion` |
| DropdownMenu | `@/components/ui/dropdown-menu/DropdownMenu` | `@/components/ui/dropdown-menu/baseDropdownMenuComponents` | `@radix-ui/react-dropdown-menu` |
| Dialog | `@/components/ui/dialog/Dialog` | `@/components/ui/dialog/baseDialogComponents` | `@radix-ui/react-dialog` |
| Table | `@/components/ui/table/Table` | `@/components/ui/table/baseTableComponents` | — |

```tsx
import { Select } from "@/components/ui/select/Select";

<Select
  value={kind}
  onValueChange={setKind}
  className="w-36"
  placeholder="Type"
  options={[
    { value: "VARIABLE", label: "Variable" },
    { value: "FIXED", label: "Fixed" },
  ]}
/>
```

```tsx
import { MultiSelect } from "@/components/ui/multi-select/MultiSelect";

<MultiSelect
  values={selectedIds}            // empty array = no filter
  onValuesChange={setSelectedIds}
  placeholder="All categories"    // shown when nothing is selected
  removeLabel="Remove"            // aria-label for the chip X buttons
  className="w-44"
  options={[{ value: "id1", label: "Groceries" }]}
/>
```

```tsx
import { ChipGroup } from "@/components/ui/chip-group/ChipGroup";

<ChipGroup
  items={[{ value: "id1", label: "Groceries" }]}
  onRemove={(value) => remove(value)}  // omit for read-only chips
  max={2}                              // defaults to 2; extra items collapse into a "+N" chip
/>
```

```tsx
import { Chip } from "@/components/ui/chip-group/Chip";

<Chip
  label="Groceries"
  variant="success"                    // default | success | danger | warning | info
  onRemove={() => remove()}            // omit for read-only chips
/>
```

```tsx
import { Accordion } from "@/components/ui/accordion/Accordion";

<Accordion
  type="multiple"            // or "single" (default, collapsible)
  onValueChange={(open) => open.forEach(load)}
  items={[{ value: "a", trigger: "Title", content: <Body /> }]}
/>
```

```tsx
import { DropdownMenu } from "@/components/ui/dropdown-menu/DropdownMenu";

<DropdownMenu
  trigger={<Button variant="ghost">Open</Button>}
  items={[
    { label: "Settings", icon: <Settings className="size-4" />, href: "/settings" },
    { kind: "separator" },
    { label: "Delete", variant: "danger", onSelect: handleDelete },
    { kind: "custom", node: <LogoutButton /> },
  ]}
/>
```

```tsx
import { Dialog } from "@/components/ui/dialog/Dialog";

<Dialog
  open
  onClose={() => setOpen(false)}
  title="Title"
  description={<Subtitle />}
  footer={<Button onClick={confirm}>OK</Button>}
>
  <Body />
</Dialog>
```

```tsx
import { Table, type TableColumn } from "@/components/ui/table/Table";

const columns: TableColumn<Row>[] = [
  { header: "Name", cellClassName: "font-medium", cell: (r) => r.name },
  { header: "Amount", headClassName: "text-end", cellClassName: "text-end tnum", cell: (r) => formatMoney(r.amount) },
];

<Table columns={columns} data={rows} rowKey={(r) => r.id} />
```

Dialogs are always mounted conditionally by the parent (`{open && <Dialog open onClose={...} />}`), so dialog state resets on close and forms initialize straight from props.

## Flat primitives

| Component | Import path | Radix dependency |
| --- | --- | --- |
| Badge | `@/components/ui/badge` | — |
| Button | `@/components/ui/button` | `@radix-ui/react-slot` |
| Calendar | `@/components/ui/calendar` | — (react-day-picker) |
| Card (+ Header/Title/Content/Footer) | `@/components/ui/card` | — |
| Checkbox | `@/components/ui/checkbox` | `@radix-ui/react-checkbox` |
| Command | `@/components/ui/command` | cmdk |
| Input | `@/components/ui/input` | — |
| Label | `@/components/ui/label` | `@radix-ui/react-label` |
| Popover | `@/components/ui/popover` | `@radix-ui/react-popover` |
| Progress | `@/components/ui/progress` | `@radix-ui/react-progress` |
| Sheet | `@/components/ui/sheet` | `@radix-ui/react-dialog` |
| Skeleton | `@/components/ui/skeleton` | — (composed by `components/shared/skeleton/*`) |
| Sonner (toasts) | `@/components/ui/sonner` | — (sonner) |
| Tabs (+ List/Trigger/Content) | `@/components/ui/tabs` | `@radix-ui/react-tabs` |
| Tooltip | `@/components/ui/tooltip` | `@radix-ui/react-tooltip` |

## Form components (`components/ui/form/`)

react-hook-form + zod building blocks. `Form` and `FormDialog` own the form state: they take `schema` + `defaultValues`, create the form internally via `useZodForm`, and render children inside a `FormProvider`. `onSubmit(values, form)` receives the parsed values plus the form instance for `setError`/`reset`. Field components read form state from context by `name` and render label/hint/error through the shared `Field` wrapper — no per-field `useState` or manual validation. Fields that need `useWatch`/`setValue` (conditional sections) live in a separate `*-fields.tsx` component rendered as the dialog's children.

| Component | Import path | Wraps |
| --- | --- | --- |
| `useZodForm` | `@/components/ui/form/use-zod-form` | `useForm` + `zodResolver`, `mode: "onBlur"` |
| `Form` | `@/components/ui/form/form` | owns the form (`schema` + `defaultValues`); `FormProvider` + `<form>` for inline/page forms |
| `FormDialog` | `@/components/ui/form/form-dialog` | owns the form (`schema` + `defaultValues`); Dialog + Cancel/Save footer; typed `onSubmit(values, form)` |
| `TextField` | `@/components/ui/form/text-field` | `Input` via `register` |
| `TextareaField` | `@/components/ui/form/textarea-field` | native `<textarea>`, `Input` styling |
| `MoneyField` | `@/components/ui/form/money-field` | `MoneyInput` via `Controller` (empty → `undefined`) |
| `SelectField` | `@/components/ui/form/select-field` | `Select` via `Controller`; optional `onValueChange` passthrough; validates on change (popover never blurs) |
| `DateField` | `@/components/ui/form/date-field` | `DatePicker` via `Controller` (`Date \| undefined`) |
| `AutocompleteField` | `@/components/ui/form/autocomplete-field` | `Autocomplete` via `Controller`; validates on change (popover never blurs) |
| `CheckboxField` | `@/components/ui/form/checkbox-field` | `Checkbox` via `Controller`, inline label |
| `NumberField` | `@/components/ui/form/number-field` | `Input type="number"` via `Controller` (empty → `undefined`, else `Number`) |
| `MonthYearField` | `@/components/ui/form/month-year-field` | shared month-year popover via `Controller`; object value `{ year, month }` (`monthYearSchema`), validates on pick |

```tsx
const schema = z.object({
  title: z.string().min(1, t.errors.required),
  amount: z.number({ error: t.errors.required }).positive(),
});
type Values = z.infer<typeof schema>;

{open && (
  <FormDialog
    open
    onClose={onClose}
    title={t.x.title}
    schema={schema}
    defaultValues={{ title: editing?.title ?? "" }}
    onSubmit={handleSubmit}
    pending={pending}
  >
    <TextField name="title" label={t.x.name} required />
    <MoneyField name="amount" label={t.x.amount} required />
  </FormDialog>
)}
```

All forms use these building blocks; there is no non-RHF form dialog.

## Shared app components (`components/shared/`)

Higher-level reusable pieces built on the primitives:

- `ConfirmDialog` (`@/components/shared/confirm-dialog`) — confirm/cancel prompt, takes `onClose`.
- `EditDeleteActions` (`@/components/shared/edit-delete-actions`) — hover-revealed pencil/trash row actions.
- `TotalsFooterRow` (`@/components/shared/totals-footer-row`) — table-card totals footer strip.
- `ChangeIndicator` (`@/components/shared/change-indicator`) — colored +/- delta (money or percent).
- `StatCard`, `Field`, `MoneyInput`, `DatePicker`, `Autocomplete`, `MonthSelect`, `YearSelect`, `MonthYearPicker`, `PageHeader`, `EmptyState`, `ProgressBar`, `IconButton`, `RowActions`, chart components under `charts/`.

## Design tokens

All color values live in `lib/design-tokens.ts` — the single source consumed by both `tailwind.config.ts` and `components/shared/charts/chart-palette.ts` (recharts needs concrete values, so the palette reads the same tokens).
