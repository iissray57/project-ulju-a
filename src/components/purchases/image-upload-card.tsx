'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadCardProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ImageUploadCard({ value, onChange, disabled }: ImageUploadCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  const uploadImage = useCallback(
    async (file: File) => {
      if (disabled) return;

      // 파일 타입 검증
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('JPG, PNG, WebP, GIF 이미지만 업로드 가능합니다');
        return;
      }

      // 파일 크기 검증 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('이미지 크기는 5MB 이하여야 합니다');
        return;
      }

      setIsUploading(true);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error('로그인이 필요합니다');
          return;
        }

        // 파일명 생성: userId/timestamp_random.ext
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('purchase-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('[ImageUpload] Upload error:', uploadError);
          toast.error('이미지 업로드 실패');
          return;
        }

        // Public URL 생성
        const {
          data: { publicUrl },
        } = supabase.storage.from('purchase-images').getPublicUrl(fileName);

        setPreviewUrl(publicUrl);
        onChange(publicUrl);
        toast.success('이미지가 업로드되었습니다');
      } catch (err) {
        console.error('[ImageUpload] Error:', err);
        toast.error('이미지 업로드 중 오류 발생');
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, onChange]
  );

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadImage(file);
      }
      // 같은 파일 재선택 가능하도록 초기화
      e.target.value = '';
    },
    [uploadImage]
  );

  // 클립보드 붙여넣기 핸들러
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (disabled) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            uploadImage(file);
          }
          break;
        }
      }
    },
    [disabled, uploadImage]
  );

  // 드래그 앤 드롭 핸들러
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        uploadImage(file);
      }
    },
    [disabled, uploadImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 이미지 삭제
  const handleRemove = useCallback(() => {
    setPreviewUrl(null);
    onChange(null);
  }, [onChange]);

  // 클립보드 이벤트 리스너 등록
  useEffect(() => {
    const element = dropZoneRef.current;
    if (!element) return;

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {previewUrl ? (
          // 이미지 미리보기
          <div className="relative">
            <img
              src={previewUrl}
              alt="발주 증빙 이미지"
              className="w-full h-48 object-cover rounded-md"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          // 업로드 영역
          <div
            ref={dropZoneRef}
            onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`
              flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-md
              transition-colors cursor-pointer
              ${disabled ? 'bg-muted cursor-not-allowed' : 'hover:border-primary hover:bg-accent/50'}
              ${isUploading ? 'pointer-events-none' : ''}
            `}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">업로드 중...</p>
              </>
            ) : (
              <>
                <ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  클릭하여 이미지 선택
                  <br />
                  또는 드래그 앤 드롭
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Ctrl+V로 캡처 이미지 붙여넣기 가능
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
