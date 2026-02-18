'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Button } from './button';
import { Check, X, Pencil } from 'lucide-react';

interface InlineEditBaseProps {
  className?: string;
  disabled?: boolean;
  onSave: (value: string | number | null) => Promise<void>;
}

interface InlineEditTextProps extends InlineEditBaseProps {
  type: 'text' | 'textarea';
  value: string | null;
  placeholder?: string;
}

interface InlineEditNumberProps extends InlineEditBaseProps {
  type: 'number' | 'currency';
  value: number | null;
  placeholder?: string;
}

interface InlineEditDateProps extends InlineEditBaseProps {
  type: 'date';
  value: string | null;
}

interface InlineEditSelectProps extends InlineEditBaseProps {
  type: 'select';
  value: string | null;
  options: { value: string; label: string }[];
}

type InlineEditProps =
  | InlineEditTextProps
  | InlineEditNumberProps
  | InlineEditDateProps
  | InlineEditSelectProps;

// 금액 포맷
function formatCurrency(amount: number | null) {
  if (amount === null) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

// 날짜 포맷
function formatDate(dateStr: string | null) {
  if (!dateStr) return '미정';
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return '미정';
  }
}

export function InlineEdit(props: InlineEditProps) {
  const { type, className, disabled, onSave } = props;
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // 편집 시작
  const startEdit = () => {
    if (disabled) return;

    if (type === 'number' || type === 'currency') {
      const numProps = props as InlineEditNumberProps;
      setEditValue(numProps.value?.toString() ?? '');
    } else if (type === 'date') {
      const dateProps = props as InlineEditDateProps;
      setEditValue(dateProps.value ?? '');
    } else if (type === 'select') {
      const selectProps = props as InlineEditSelectProps;
      setEditValue(selectProps.value ?? '');
    } else {
      const textProps = props as InlineEditTextProps;
      setEditValue(textProps.value ?? '');
    }
    setIsEditing(true);
  };

  // 편집 후 포커스
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // 저장
  const handleSave = async () => {
    setIsSaving(true);
    try {
      let valueToSave: string | number | null;

      if (type === 'number' || type === 'currency') {
        valueToSave = editValue === '' ? null : Number(editValue);
      } else if (type === 'date') {
        valueToSave = editValue === '' ? null : editValue;
      } else {
        valueToSave = editValue === '' ? null : editValue;
      }

      await onSave(valueToSave);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 취소
  const handleCancel = () => {
    setIsEditing(false);
  };

  // 키보드 이벤트
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // 표시 값 렌더링
  const renderDisplayValue = () => {
    if (type === 'currency') {
      return formatCurrency(props.value);
    } else if (type === 'number') {
      return props.value?.toLocaleString('ko-KR') ?? '-';
    } else if (type === 'date') {
      return formatDate(props.value);
    } else if (type === 'select') {
      const option = props.options.find(o => o.value === props.value);
      return option?.label ?? '-';
    } else {
      return props.value || '-';
    }
  };

  // 편집 모드
  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {type === 'textarea' ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px]"
            disabled={isSaving}
          />
        ) : type === 'select' ? (
          <Select value={editValue} onValueChange={setEditValue} disabled={isSaving}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {props.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === 'date' ? (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
          />
        ) : type === 'number' || type === 'currency' ? (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            min={0}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={(props as InlineEditTextProps).placeholder}
            disabled={isSaving}
          />
        )}
        <div className="flex gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    );
  }

  // 표시 모드
  return (
    <div
      className={cn(
        'group flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 -mx-2 -my-1 hover:bg-muted/50 transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={startEdit}
    >
      <span className={cn('font-medium', type === 'textarea' && 'whitespace-pre-wrap text-sm')}>
        {renderDisplayValue()}
      </span>
      {!disabled && (
        <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  );
}
