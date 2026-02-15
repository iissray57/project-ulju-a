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
import { CustomerForm } from './customer-form';
import type { CustomerInput } from '@/lib/schemas/customer';

interface CustomerFormDialogProps {
  customerId?: string;
  defaultValues?: CustomerInput;
  trigger?: React.ReactNode;
}

export function CustomerFormDialog({
  customerId,
  defaultValues,
  trigger,
}: CustomerFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();

  const isEdit = !!customerId;

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
          {isEdit ? '수정' : '신규 고객 등록'}
        </Button>
      )}
      <DialogContent
        className="sm:max-w-lg max-h-[85vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? '고객 정보 수정' : '신규 고객 등록'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '고객 정보를 수정합니다.' : '새로운 고객을 등록합니다.'}
          </DialogDescription>
        </DialogHeader>
        <CustomerForm
          key={formKey}
          customerId={customerId}
          defaultValues={defaultValues}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
