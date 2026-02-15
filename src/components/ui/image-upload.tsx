'use client';

import { useState, useRef } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uploadImage } from '@/lib/actions/upload';

interface ImageUploadProps {
  value?: string | null;
  onChange?: (url: string | null) => void;
  onUpload?: (result: { url: string; path: string }) => void;
  disabled?: boolean;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  disabled,
  className,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  maxSizeMB = 5,
  placeholder = '이미지를 드래그하거나 클릭하여 업로드',
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (disabled || isUploading) return;

    // Client-side validation
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`파일 크기가 ${maxSizeMB}MB를 초과합니다.`);
      return;
    }

    const allowedTypes = accept.split(',').map((t) => t.trim());
    if (!allowedTypes.includes(file.type)) {
      toast.error('지원하지 않는 파일 형식입니다.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadImage(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        onChange?.(result.data.url);
        onUpload?.(result.data);
        toast.success('이미지 업로드 완료');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input to allow re-uploading same file
    e.target.value = '';
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
  };

  return (
    <div className={cn('relative group', className)}>
      {value ? (
        // Preview mode
        <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
          <img src={value} alt="" className="w-full h-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 size-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <X className="size-4 text-foreground" />
            </button>
          )}
        </div>
      ) : (
        // Upload mode
        <div
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors aspect-video',
            isDragging
              ? 'border-primary bg-primary/5 dark:bg-primary/10'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50 dark:border-muted-foreground/20 dark:hover:border-muted-foreground/40',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImagePlus className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">{placeholder}</p>
              <p className="text-xs text-muted-foreground/60">
                JPG, PNG, WebP (최대 {maxSizeMB}MB)
              </p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
    </div>
  );
}
