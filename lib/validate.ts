import { z } from "zod";

// Server actions receive raw JSON from the client — TypeScript param types are
// not enforced at runtime, so a crafted request can pass a Prisma operator
// object (e.g. {"not": ""}) where a string id is expected. Validate every bare
// scalar argument before it reaches a query.
export const idSchema = z.string().min(1).max(64);
export const yearSchema = z.number().int().min(1970).max(2200);
export const monthSchema = z.number().int().min(1).max(12);
