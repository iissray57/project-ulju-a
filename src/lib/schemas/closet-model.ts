import { z } from 'zod';

// 모델 데이터 스키마 (에디터 상태 직렬화)
export const modelDataSchema = z.object({
  components: z.array(z.record(z.string(), z.unknown())),
  gridSize: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number(),
  }),
  version: z.number().default(1),
});

export type ModelData = z.infer<typeof modelDataSchema>;

// 폼 스키마
export const closetModelFormSchema = z.object({
  order_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, '모델명을 입력하세요').default('기본 모델'),
  model_data: modelDataSchema,
  thumbnail_url: z.string().url().optional().nullable(),
});

export type ClosetModelFormData = z.infer<typeof closetModelFormSchema>;
