import { z } from 'zod';

export const workSectionSchema = z.object({
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

export const workSpecSchema = z.object({
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  depth: z.number().positive().optional(),
  sections: z.array(workSectionSchema).optional(),
  frame_type: z.enum(['angle', 'system', 'mixed']).optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  door_type: z.enum(['none', 'sliding', 'hinged']).optional(),
  notes: z.string().optional(),
  // 커스텀 텍스트 (자유 입력)
  custom_text: z.string().optional(),
});

export type WorkSpec = z.infer<typeof workSpecSchema>;
export type WorkSection = z.infer<typeof workSectionSchema>;
