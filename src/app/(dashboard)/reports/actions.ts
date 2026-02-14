'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Common result type
export interface ActionResult<T = unknown> {
  data?: T;
  error?: string;
  count?: number;
}

// Saved report metadata extracted from storage path
export interface SavedReport {
  id: string;
  user_id: string;
  order_id: string | null;
  type: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  created_at: string;
}

// Report save parameters
export interface SaveReportParams {
  orderId: string;
  type: 'quotation' | 'checklist';
  fileName: string;
  pdfBuffer: Uint8Array;
}

// Report list parameters
export interface GetReportsParams {
  orderId?: string;
  type?: string;
}

/**
 * Save report to Supabase Storage
 * Path: {user_id}/{order_id}/{type}_{timestamp}.pdf
 */
export async function saveReport(
  params: SaveReportParams
): Promise<ActionResult<SavedReport>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { orderId, type, fileName, pdfBuffer } = params;
    const timestamp = Date.now();
    const storagePath = `${user.id}/${orderId}/${type}_${timestamp}.pdf`;

    // Ensure bucket exists (try to create it, ignore if already exists)
    const { error: bucketError } = await supabase.storage.createBucket('reports', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('[saveReport] Bucket creation error:', bucketError);
      // Continue anyway - bucket might already exist
    }

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[saveReport] Upload error:', uploadError);
      return { error: uploadError.message };
    }

    // Get file metadata
    const { data: fileList, error: listError } = await supabase.storage
      .from('reports')
      .list(`${user.id}/${orderId}`, {
        search: `${type}_${timestamp}`,
      });

    if (listError || !fileList || fileList.length === 0) {
      console.error('[saveReport] List error:', listError);
      return { error: '파일 메타데이터를 가져올 수 없습니다.' };
    }

    const fileMetadata = fileList[0];

    // Construct SavedReport
    const savedReport: SavedReport = {
      id: uploadData.id || fileMetadata.id,
      user_id: user.id,
      order_id: orderId,
      type,
      file_name: fileName,
      storage_path: storagePath,
      file_size: fileMetadata.metadata?.size || 0,
      created_at: fileMetadata.created_at || new Date().toISOString(),
    };

    revalidatePath('/reports');
    return { data: savedReport };
  } catch (err) {
    console.error('[saveReport] Unexpected error:', err);
    return { error: '리포트 저장 중 오류가 발생했습니다.' };
  }
}

/**
 * Get list of reports
 * Optionally filter by orderId or type
 */
export async function getReports(
  params: GetReportsParams = {}
): Promise<ActionResult<SavedReport[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { orderId, type } = params;

    // List all files under user's folder
    const listPath = orderId ? `${user.id}/${orderId}` : `${user.id}`;
    const { data: fileList, error: listError } = await supabase.storage
      .from('reports')
      .list(listPath, {
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (listError) {
      console.error('[getReports] List error:', listError);
      return { error: listError.message };
    }

    if (!fileList) {
      return { data: [], count: 0 };
    }

    // Parse file paths into SavedReport objects
    const reports: SavedReport[] = [];

    // If no orderId specified, we need to recursively list all order folders
    if (!orderId) {
      // fileList contains order_id folders
      for (const folder of fileList) {
        if (!folder.id) continue; // Skip if not a folder

        const { data: orderFiles, error: orderListError } = await supabase.storage
          .from('reports')
          .list(`${user.id}/${folder.name}`, {
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (orderListError || !orderFiles) {
          continue;
        }

        for (const file of orderFiles) {
          if (!file.name.endsWith('.pdf')) continue;

          // Parse filename: {type}_{timestamp}.pdf
          const match = file.name.match(/^(quotation|checklist)_(\d+)\.pdf$/);
          if (!match) continue;

          const fileType = match[1];

          // Apply type filter
          if (type && fileType !== type) continue;

          reports.push({
            id: file.id,
            user_id: user.id,
            order_id: folder.name,
            type: fileType,
            file_name: file.name,
            storage_path: `${user.id}/${folder.name}/${file.name}`,
            file_size: file.metadata?.size || 0,
            created_at: file.created_at,
          });
        }
      }
    } else {
      // orderId specified, list files directly
      for (const file of fileList) {
        if (!file.name.endsWith('.pdf')) continue;

        // Parse filename: {type}_{timestamp}.pdf
        const match = file.name.match(/^(quotation|checklist)_(\d+)\.pdf$/);
        if (!match) continue;

        const fileType = match[1];

        // Apply type filter
        if (type && fileType !== type) continue;

        reports.push({
          id: file.id,
          user_id: user.id,
          order_id: orderId,
          type: fileType,
          file_name: file.name,
          storage_path: `${user.id}/${orderId}/${file.name}`,
          file_size: file.metadata?.size || 0,
          created_at: file.created_at,
        });
      }
    }

    return { data: reports, count: reports.length };
  } catch (err) {
    console.error('[getReports] Unexpected error:', err);
    return { error: '리포트 목록 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * Delete report from storage
 */
export async function deleteReport(reportId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // Find the file by searching all folders
    const { data: folders, error: foldersError } = await supabase.storage
      .from('reports')
      .list(`${user.id}`);

    if (foldersError || !folders) {
      console.error('[deleteReport] Folders list error:', foldersError);
      return { error: '파일을 찾을 수 없습니다.' };
    }

    let targetPath: string | null = null;

    // Search for the file in all order folders
    for (const folder of folders) {
      const { data: files, error: filesError } = await supabase.storage
        .from('reports')
        .list(`${user.id}/${folder.name}`);

      if (filesError || !files) continue;

      const file = files.find((f) => f.id === reportId);
      if (file) {
        targetPath = `${user.id}/${folder.name}/${file.name}`;
        break;
      }
    }

    if (!targetPath) {
      return { error: '파일을 찾을 수 없습니다.' };
    }

    // Delete file
    const { error: deleteError } = await supabase.storage
      .from('reports')
      .remove([targetPath]);

    if (deleteError) {
      console.error('[deleteReport] Delete error:', deleteError);
      return { error: deleteError.message };
    }

    revalidatePath('/reports');
    return { data: undefined };
  } catch (err) {
    console.error('[deleteReport] Unexpected error:', err);
    return { error: '리포트 삭제 중 오류가 발생했습니다.' };
  }
}

/**
 * Get signed download URL for report
 */
export async function getReportDownloadUrl(
  reportId: string
): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    // Find the file by searching all folders
    const { data: folders, error: foldersError } = await supabase.storage
      .from('reports')
      .list(`${user.id}`);

    if (foldersError || !folders) {
      console.error('[getReportDownloadUrl] Folders list error:', foldersError);
      return { error: '파일을 찾을 수 없습니다.' };
    }

    let targetPath: string | null = null;

    // Search for the file in all order folders
    for (const folder of folders) {
      const { data: files, error: filesError } = await supabase.storage
        .from('reports')
        .list(`${user.id}/${folder.name}`);

      if (filesError || !files) continue;

      const file = files.find((f) => f.id === reportId);
      if (file) {
        targetPath = `${user.id}/${folder.name}/${file.name}`;
        break;
      }
    }

    if (!targetPath) {
      return { error: '파일을 찾을 수 없습니다.' };
    }

    // Create signed URL (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('reports')
      .createSignedUrl(targetPath, 3600);

    if (urlError || !urlData) {
      console.error('[getReportDownloadUrl] Signed URL error:', urlError);
      return { error: urlError?.message || 'URL 생성에 실패했습니다.' };
    }

    return { data: urlData.signedUrl };
  } catch (err) {
    console.error('[getReportDownloadUrl] Unexpected error:', err);
    return { error: '다운로드 URL 생성 중 오류가 발생했습니다.' };
  }
}
