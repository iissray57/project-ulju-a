import { z } from 'zod';

export const SCHEDULE_TYPES = [
  'measurement',
  'installation',
  'visit',
  'delivery',
  'other',
] as const;

export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  measurement: '실측',
  installation: '설치',
  visit: '방문',
  delivery: '배송',
  other: '기타',
};

export const SCHEDULE_TYPE_COLORS: Record<ScheduleType, string> = {
  measurement: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  installation: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  visit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  delivery: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export const scheduleFormSchema = z.object({
  order_id: z.string().uuid().optional(),
  type: z.enum(SCHEDULE_TYPES),
  title: z.string().min(1, '제목을 입력하세요'),
  scheduled_date: z.string().min(1, '날짜를 선택하세요'), // ISO date
  scheduled_time: z.string().optional(), // HH:mm
  duration_minutes: z.number().int().positive().optional(),
  location: z.string().optional(),
  memo: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

export type ScheduleFormData = z.infer<typeof scheduleFormSchema>;
