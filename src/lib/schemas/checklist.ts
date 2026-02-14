import { z } from 'zod/v4';

export const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  checked: z.boolean().default(false),
  note: z.string().optional(),
});

export type ChecklistItem = z.infer<typeof checklistItemSchema>;

// 기본 준비 체크리스트 템플릿
export const DEFAULT_PREPARATION_CHECKLIST: ChecklistItem[] = [
  { id: 'prep-1', label: '현장 실측 완료', checked: false },
  { id: 'prep-2', label: '자재 확보 확인', checked: false },
  { id: 'prep-3', label: '고객 일정 확인', checked: false },
  { id: 'prep-4', label: '운반 차량 준비', checked: false },
  { id: 'prep-5', label: '공구 점검', checked: false },
];

// 기본 설치 체크리스트 템플릿
export const DEFAULT_INSTALLATION_CHECKLIST: ChecklistItem[] = [
  { id: 'inst-1', label: '벽면 수직/수평 확인', checked: false },
  { id: 'inst-2', label: '프레임 설치', checked: false },
  { id: 'inst-3', label: '선반/행거 설치', checked: false },
  { id: 'inst-4', label: '도어/서랍 설치', checked: false },
  { id: 'inst-5', label: '마감 처리', checked: false },
  { id: 'inst-6', label: '청소 완료', checked: false },
  { id: 'inst-7', label: '고객 확인 서명', checked: false },
];
