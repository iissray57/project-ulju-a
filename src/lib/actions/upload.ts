'use server';

import { createClient } from '@/lib/supabase/server';

const BUCKET = 'images';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface UploadResult {
  url: string;
  path: string;
}

export async function uploadImage(
  formData: FormData
): Promise<{ data?: UploadResult; error?: string }> {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: '인증되지 않았습니다.' };
    }

    // Get file from formData
    const file = formData.get('file') as File | null;
    if (!file) {
      return { error: '파일이 없습니다.' };
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: '지원하지 않는 파일 형식입니다. (JPG, PNG, WebP, GIF만 가능)' };
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return { error: '파일 크기가 5MB를 초과합니다.' };
    }

    // Ensure bucket exists (defensive)
    const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE,
    });

    // Ignore "already exists" error
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Bucket creation error:', bucketError);
      // Continue anyway - bucket might exist
    }

    // Generate file path
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${user.id}/${timestamp}_${sanitizedFilename}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { error: '파일 업로드에 실패했습니다.' };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return {
      data: {
        url: publicUrl,
        path,
      },
    };
  } catch (error) {
    console.error('Upload action error:', error);
    return { error: '파일 업로드 중 오류가 발생했습니다.' };
  }
}

export async function deleteImage(path: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: '인증되지 않았습니다.' };
    }

    // Verify path starts with user ID (security)
    if (!path.startsWith(`${user.id}/`)) {
      return { error: '권한이 없습니다.' };
    }

    // Delete file
    const { error: deleteError } = await supabase.storage.from(BUCKET).remove([path]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return { error: '파일 삭제에 실패했습니다.' };
    }

    return {};
  } catch (error) {
    console.error('Delete action error:', error);
    return { error: '파일 삭제 중 오류가 발생했습니다.' };
  }
}
