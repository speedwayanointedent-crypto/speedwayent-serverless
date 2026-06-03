import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1),
  category_id: z.string(),
  brand_id: z.string().nullable().optional(),
  model_id: z.string().nullable().optional(),
  year_id: z.string().nullable().optional(),
  price: z.number(),
  cost_price: z.number().nullable().optional(),
  quantity: z.number().int(),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  gallery: z
    .array(
      z.object({
        url: z.string(),
        type: z.enum(["image", "video"]).default("image"),
      })
    )
    .default([]),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const productUpdateSchema = productSchema.partial();
