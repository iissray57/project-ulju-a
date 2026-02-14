'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  closetPresetFormSchema,
  type ClosetPresetFormData,
  PRESET_CATEGORIES,
} from '@/lib/schemas/closet-preset';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createPreset, updatePreset } from '@/app/(dashboard)/closet/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PresetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetId?: string;
  defaultValues?: Partial<ClosetPresetFormData>;
}

export function PresetFormDialog({
  open,
  onOpenChange,
  presetId,
  defaultValues,
}: PresetFormDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClosetPresetFormData>({
    resolver: zodResolver(closetPresetFormSchema),
    defaultValues: defaultValues || {
      name: '',
      category: '',
      preset_data: {
        width: 900,
        height: 2400,
        depth: 450,
        color: '#CCCCCC',
        material: 'wood',
        geometry: 'box',
      },
    },
  });

  const onSubmit = async (data: ClosetPresetFormData) => {
    setIsSubmitting(true);
    try {
      const result = presetId
        ? await updatePreset(presetId, data)
        : await createPreset(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(presetId ? '프리셋이 수정되었습니다.' : '프리셋이 생성되었습니다.');
        form.reset();
        onOpenChange(false);
        router.refresh();
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{presetId ? '프리셋 수정' : '새 프리셋 생성'}</DialogTitle>
          <DialogDescription>
            옷장 컴포넌트 프리셋을 {presetId ? '수정' : '생성'}합니다.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프리셋 이름</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 앵글 프레임 900x2400" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>카테고리</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRESET_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="preset_data.width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>너비 (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preset_data.height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>높이 (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preset_data.depth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>깊이 (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preset_data.color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>색상 (HEX)</FormLabel>
                  <FormControl>
                    <Input placeholder="#CCCCCC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preset_data.material"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>재질</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="wood">Wood</SelectItem>
                      <SelectItem value="metal">Metal</SelectItem>
                      <SelectItem value="plastic">Plastic</SelectItem>
                      <SelectItem value="glass">Glass</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preset_data.geometry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>형태</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="cylinder">Cylinder</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '처리 중...' : presetId ? '수정' : '생성'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
