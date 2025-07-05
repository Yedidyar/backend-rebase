import z from "zod/v4";

export const pageViewsFiltersSchema = z.object({
  take: z.number().min(1).max(24).optional(),
  now: z.iso.datetime().optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
});

export type PageViewsFilters = z.infer<typeof pageViewsFiltersSchema>;
