import { z } from 'zod';

export const closetSectionSchema = z.object({
  type: z.enum(['shelf', 'hanger', 'drawer', 'open']),
  width: z.number().positive(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  shelves_count: z.number().int().nonnegative().optional(),
  hanger_bar_count: z.number().int().nonnegative().optional(),
  drawer_count: z.number().int().nonnegative().optional(),
});

export const closetSpecSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  sections: z.array(closetSectionSchema),
  frame_type: z.enum(['angle', 'system', 'mixed']),
  color: z.string().optional(),
  material: z.string().optional(),
  door_type: z.enum(['none', 'sliding', 'hinged']).optional(),
  notes: z.string().optional(),
});

export type ClosetSpec = z.infer<typeof closetSpecSchema>;
export type ClosetSection = z.infer<typeof closetSectionSchema>;
