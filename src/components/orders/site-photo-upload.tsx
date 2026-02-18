'use client';

import { useState } from 'react';
import { Camera, Upload, X, Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { uploadSitePhoto, syncPendingUploads } from '@/lib/storage/photo-sync';
import { idbStorage } from '@/lib/storage/indexed-db';
import { useToast } from '@/hooks/use-toast';

interface SitePhotoUploadProps {
  orderId: string;
  existingPhotos?: string[];
  onUploadSuccess?: (url: string) => void;
}

export function SitePhotoUpload({
  orderId,
  existingPhotos = [],
  onUploadSuccess,
}: SitePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const { toast } = useToast();

  // 온라인/오프라인 상태 감지
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const result = await uploadSitePhoto(orderId, file);

        if (result.success) {
          if (result.url) {
            onUploadSuccess?.(result.url);
            toast({
              title: '사진 업로드 성공',
              description: '현장 사진이 업로드되었습니다.',
            });
          } else {
            toast({
              title: '오프라인 저장 완료',
              description: '온라인 상태가 되면 자동으로 업로드됩니다.',
              variant: 'default',
            });
          }
        } else {
          toast({
            title: '업로드 실패',
            description: result.error,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        title: '오프라인 상태',
        description: '인터넷 연결을 확인해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      await syncPendingUploads();
      toast({
        title: '동기화 완료',
        description: '대기 중인 사진이 모두 업로드되었습니다.',
      });
    } catch (error) {
      toast({
        title: '동기화 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id="site-photo-input"
        />
        <Button
          onClick={() => document.getElementById('site-photo-input')?.click()}
          disabled={uploading}
          variant="outline"
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          현장 사진 촬영
        </Button>

        {!isOnline && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <WifiOff className="h-4 w-4" />
            오프라인
          </div>
        )}

        {isOnline && (
          <Button
            onClick={handleSync}
            disabled={uploading}
            variant="ghost"
            size="sm"
          >
            <Upload className="mr-2 h-4 w-4" />
            동기화
          </Button>
        )}
      </div>

      {existingPhotos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {existingPhotos.map((url, index) => (
            <Card key={index}>
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <img
                    src={url}
                    alt={`현장 사진 ${index + 1}`}
                    className="object-cover rounded w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
