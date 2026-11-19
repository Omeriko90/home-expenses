# UI Components

Shared shadcn-style components in `components/ui/`.

| Component | Import | Radix dependency | Usage |
|---|---|---|---|
| Accordion | `@/components/ui/accordion` | `@radix-ui/react-accordion` | `<Accordion type="multiple"><AccordionItem value="a"><AccordionTrigger>…</AccordionTrigger><AccordionContent>…</AccordionContent></AccordionItem></Accordion>` |
| Badge | `@/components/ui/badge` | — | `<Badge variant="primary">3</Badge>` |
| Button | `@/components/ui/button` | — | `<Button variant="outline" size="icon">…</Button>` |
| Calendar | `@/components/ui/calendar` | — | date picking |
| Card | `@/components/ui/card` | — | `<Card><CardHeader><CardTitle>…</CardTitle></CardHeader><CardContent>…</CardContent></Card>` |
| Checkbox | `@/components/ui/checkbox` | `@radix-ui/react-checkbox` | `<Checkbox checked onCheckedChange={…} />` |
| Command | `@/components/ui/command` | — (cmdk) | command palette / autocomplete list |
| Dialog | `@/components/ui/dialog` | `@radix-ui/react-dialog` | gate with `{open && <MyDialog open …/>}` in the parent |
| DropdownMenu | `@/components/ui/dropdown-menu` | `@radix-ui/react-dropdown-menu` | `<DropdownMenu><DropdownMenuTrigger asChild>…</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={…}>…</DropdownMenuItem></DropdownMenuContent></DropdownMenu>` |
| Input | `@/components/ui/input` | — | `<Input value={v} onChange={…} />` |
| Popover | `@/components/ui/popover` | `@radix-ui/react-popover` | `<Popover><PopoverTrigger asChild>…</PopoverTrigger><PopoverContent align="end">…</PopoverContent></Popover>` |
| Select | `@/components/ui/select` | `@radix-ui/react-select` | `<Select value onValueChange><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="a">A</SelectItem></SelectContent></Select>` |
| Sheet | `@/components/ui/sheet` | `@radix-ui/react-dialog` | slide-in drawer (mobile nav) |
| Skeleton | `@/components/ui/skeleton` | — | `<Skeleton className="h-9 w-40 rounded-lg" />` — pulse placeholder; composed by `components/shared/skeleton/*` |
| Table | `@/components/ui/table` | — | wraps `<table>` in an `overflow-x-auto` container; `containerClassName` for scroll behavior |
| Tabs | `@/components/ui/tabs` | `@radix-ui/react-tabs` | `<Tabs value onValueChange><TabsList><TabsTrigger value="a"/></TabsList><TabsContent value="a"/></Tabs>` |
| Tooltip | `@/components/ui/tooltip` | `@radix-ui/react-tooltip` | hover hint; supports `disabled` |
