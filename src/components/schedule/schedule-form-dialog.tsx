'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScheduleForm } from './schedule-form';
import type { ScheduleFormData } from '@/lib/schemas/schedule';

interface ScheduleFormDialogProps {
  scheduleId?: string;
  defaultValues?: Partial<ScheduleFormData>;
  orderId?: string;
  orderNumber?: string;
  trigger?: React.ReactNode;
}

export function ScheduleFormDialog({
  scheduleId,
  defaultValues,
  orderId,
  orderNumber,
  trigger,
}: ScheduleFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();

  const isEdit = !!scheduleId;

  const handleSuccess = useCallback(() => {
    setOpen(false);
    setFormKey((k) => k + 1);
    router.refresh();
  }, [router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button onClick={() => setOpen(true)}>
          {isEdit ? '일정 수정' : '신규 일정 등록'}
        </Button>
      )}
      <DialogContent
        className="sm:max-w-lg max-h-[85vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? '일정 수정' : '신규 일정 등록'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '일정을 수정합니다.' : '새로운 일정을 등록합니다.'}
          </DialogDescription>
        </DialogHeader>
        <ScheduleForm
          key={formKey}
          scheduleId={scheduleId}
          defaultValues={defaultValues}
          orderId={orderId}
          orderNumber={orderNumber}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
