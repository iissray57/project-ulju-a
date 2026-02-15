'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  scheduleFormSchema,
  type ScheduleFormData,
  SCHEDULE_TYPES,
  SCHEDULE_TYPE_LABELS,
} from '@/lib/schemas/schedule';
import { createSchedule, updateSchedule } from '@/app/(dashboard)/schedule/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

// 10분 단위 시간 옵션 생성 (06:00 ~ 22:00)
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let min = 0; min < 60; min += 10) {
      const value = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const label = `${hour}:${min.toString().padStart(2, '0')}`;
      options.push({ value, label });
    }
  }
  return options;
}

// 10분 단위 소요시간 옵션 (10분 ~ 4시간)
const DURATION_OPTIONS = [
  { value: 10, label: '10분' },
  { value: 20, label: '20분' },
  { value: 30, label: '30분' },
  { value: 40, label: '40분' },
  { value: 50, label: '50분' },
  { value: 60, label: '1시간' },
  { value: 90, label: '1시간 30분' },
  { value: 120, label: '2시간' },
  { value: 150, label: '2시간 30분' },
  { value: 180, label: '3시간' },
  { value: 240, label: '4시간' },
];

interface ScheduleFormProps {
  scheduleId?: string;
  defaultValues?: Partial<ScheduleFormData>;
  orderId?: string;
  orderNumber?: string;
}

export function ScheduleForm({
  scheduleId,
  defaultValues,
  orderId,
  orderNumber,
}: ScheduleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [useEndTime, setUseEndTime] = useState(false);
  const [endTime, setEndTime] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      type: defaultValues?.type ?? 'other',
      title: defaultValues?.title ?? '',
      scheduled_date: defaultValues?.scheduled_date ?? '',
      scheduled_time: defaultValues?.scheduled_time ?? '',
      duration_minutes: defaultValues?.duration_minutes,
      location: defaultValues?.location ?? '',
      memo: defaultValues?.memo ?? '',
      is_active: defaultValues?.is_active ?? true,
      order_id: orderId ?? defaultValues?.order_id,
    } as ScheduleFormData,
  });

  const selectedType = watch('type');
  const selectedTime = watch('scheduled_time');
  const selectedDuration = watch('duration_minutes');
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  // 종료시간으로 소요시간 자동 계산
  const calculateDuration = (start: string, end: string): number | undefined => {
    if (!start || !end) return undefined;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const diff = endMinutes - startMinutes;
    return diff > 0 ? diff : undefined;
  };

  const onSubmit = async (data: ScheduleFormData) => {
    setIsSubmitting(true);

    // 종료시간 사용 시 duration 계산
    if (useEndTime && selectedTime && endTime) {
      const duration = calculateDuration(selectedTime, endTime);
      if (duration) {
        data.duration_minutes = duration;
      }
    }

    // 전일인 경우 시간 정보 초기화
    if (isAllDay) {
      data.scheduled_time = undefined;
      data.duration_minutes = undefined;
    }

    try {
      const result = scheduleId
        ? await updateSchedule(scheduleId, data)
        : await createSchedule(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(scheduleId ? '일정이 수정되었습니다.' : '일정이 등록되었습니다.');
      router.push('/schedule');
      router.refresh();
    } catch {
      toast.error('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 연결된 주문 정보 (있는 경우) */}
      {orderId && orderNumber && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">연결된 주문</p>
          <p className="font-medium">{orderNumber}</p>
        </div>
      )}

      {/* 일정 유형 */}
      <div className="space-y-2">
        <Label htmlFor="type">일정 유형 *</Label>
        <Select
          value={selectedType}
          onValueChange={(value) => setValue('type', value as ScheduleFormData['type'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="유형 선택" />
          </SelectTrigger>
          <SelectContent>
            {SCHEDULE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {SCHEDULE_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
      </div>

      {/* 제목 */}
      <div className="space-y-2">
        <Label htmlFor="title">제목 *</Label>
        <Input id="title" placeholder="일정 제목 입력" {...register('title')} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      {/* 날짜 */}
      <div className="space-y-2">
        <Label htmlFor="scheduled_date">날짜 *</Label>
        <Input id="scheduled_date" type="date" {...register('scheduled_date')} />
        {errors.scheduled_date && (
          <p className="text-sm text-destructive">{errors.scheduled_date.message}</p>
        )}
      </div>

      {/* 전일 옵션 */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="isAllDay"
          checked={isAllDay}
          onCheckedChange={(checked) => {
            setIsAllDay(!!checked);
            if (checked) {
              setValue('scheduled_time', '');
              setUseEndTime(false);
              setEndTime('');
            }
          }}
        />
        <Label htmlFor="isAllDay" className="cursor-pointer">
          전일 (하루 종일)
        </Label>
      </div>

      {/* 시간 설정 (전일이 아닐 때만) */}
      {!isAllDay && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_time">시작 시간</Label>
              <Select
                value={selectedTime || ''}
                onValueChange={(value) => setValue('scheduled_time', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="시작 시간 선택" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 종료시간 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="useEndTime"
                  checked={useEndTime}
                  onCheckedChange={(checked) => {
                    setUseEndTime(!!checked);
                    if (!checked) setEndTime('');
                  }}
                />
                <Label htmlFor="useEndTime" className="cursor-pointer">
                  종료 시간
                </Label>
              </div>
              <Select
                value={endTime}
                onValueChange={setEndTime}
                disabled={!useEndTime}
              >
                <SelectTrigger>
                  <SelectValue placeholder="종료 시간 선택" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 소요시간 (종료시간 미사용 시) */}
          {!useEndTime && (
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">예상 소요시간</Label>
              <Select
                value={selectedDuration?.toString() || ''}
                onValueChange={(value) => setValue('duration_minutes', parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="소요시간 선택" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* 장소 */}
      <div className="space-y-2">
        <Label htmlFor="location">장소</Label>
        <Input id="location" placeholder="장소 입력" {...register('location')} />
      </div>

      {/* 메모 */}
      <div className="space-y-2">
        <Label htmlFor="memo">메모</Label>
        <Textarea id="memo" placeholder="메모 입력" rows={3} {...register('memo')} />
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : scheduleId ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  );
}
