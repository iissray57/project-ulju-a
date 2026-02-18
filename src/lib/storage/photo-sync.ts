/**
 * 사진 동기화 로직 - 온라인/오프라인 처리 및 자동 재시도
 */

import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/image-compress';
import { idbStorage, type PendingUpload } from './indexed-db';

const MAX_RETRY_COUNT = 3;

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 사진 업로드 (온라인/오프라인 자동 처리)
 */
export async function uploadSitePhoto(
  orderId: string,
  file: File
): Promise<UploadResult> {
  // 이미지 압축
  const compressedFile = await compressImage(file);

  // 온라인 상태 확인
  if (!navigator.onLine) {
    // 오프라인: IndexedDB에 저장
    const pendingUpload: PendingUpload = {
      id: crypto.randomUUID(),
      orderId,
      file: compressedFile,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await idbStorage.addPendingUpload(pendingUpload);
    return { success: true };
  }

  // 온라인: 즉시 업로드
  return uploadToSupabase(orderId, compressedFile);
}

/**
 * Supabase Storage에 업로드
 */
async function uploadToSupabase(
  orderId: string,
  file: File
): Promise<UploadResult> {
  try {
    const supabase = createClient();
    const fileName = `${orderId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('site-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('site-photos').getPublicUrl(data.path);

    // orders 테이블 업데이트 - 기존 배열에 URL 추가
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('site_photos')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const currentPhotos = (orderData?.site_photos as string[]) || [];
    const updatedPhotos = [...currentPhotos, publicUrl];

    const { error: updateError } = await supabase
      .from('orders')
      .update({ site_photos: updatedPhotos })
      .eq('id', orderId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, url: publicUrl };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * 대기 중인 업로드 동기화
 */
export async function syncPendingUploads(): Promise<void> {
  if (!navigator.onLine) return;

  const pending = await idbStorage.getPendingUploads();

  for (const upload of pending) {
    if (upload.retryCount >= MAX_RETRY_COUNT) {
      // 최대 재시도 횟수 초과: 삭제
      await idbStorage.deletePendingUpload(upload.id);
      continue;
    }

    const result = await uploadToSupabase(upload.orderId, upload.file);

    if (result.success) {
      // 성공: IndexedDB에서 삭제
      await idbStorage.deletePendingUpload(upload.id);
    } else {
      // 실패: 재시도 카운트 증가
      upload.retryCount += 1;
      upload.lastError = result.error;
      await idbStorage.updatePendingUpload(upload);
    }
  }
}

/**
 * 온라인 상태 변경 시 자동 동기화
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncPendingUploads().catch(console.error);
  });
}
