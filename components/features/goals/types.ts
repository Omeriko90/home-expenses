export type Milestone = { id: string; title: string; done: boolean };

export type Goal = {
  id: string;
  title: string;
  type: "NUMERIC" | "CHECKLIST";
  note?: string;
  target?: number;
  current: number;
  linkKind: "NONE" | "CATEGORY" | "INVESTMENT_TOTAL";
  linkCategoryId?: string;
  linkCategoryName?: string;
  milestones: Milestone[];
};

export type GoalCategory = { id: string; name: string };
