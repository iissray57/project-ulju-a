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

// ── Statistics Actions ────────────────────────────────────────────

export interface MonthlyRevenue {
  month: number;
  revenue: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface QuarterlyData {
  quarter: string;
  revenue: number;
}

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  total_revenue: number;
  order_count: number;
}

/**
 * Get monthly revenue for a given year
 */
export async function getMonthlyRevenue(
  year: number
): Promise<ActionResult<MonthlyRevenue[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data, error } = await supabase
      .from('orders')
      .select('confirmed_amount, revenue_confirmed_at')
      .eq('user_id', user.id)
      .not('confirmed_amount', 'is', null)
      .gte('revenue_confirmed_at', startDate)
      .lte('revenue_confirmed_at', endDate);

    if (error) {
      console.error('[getMonthlyRevenue] Query error:', error);
      return { error: error.message };
    }

    // Aggregate by month
    const monthlyData: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = 0;
    }

    data?.forEach((order) => {
      if (order.revenue_confirmed_at && order.confirmed_amount) {
        const month = new Date(order.revenue_confirmed_at).getMonth() + 1;
        monthlyData[month] += order.confirmed_amount;
      }
    });

    const result: MonthlyRevenue[] = Object.entries(monthlyData).map(
      ([month, revenue]) => ({
        month: Number(month),
        revenue,
      })
    );

    return { data: result };
  } catch (err) {
    console.error('[getMonthlyRevenue] Unexpected error:', err);
    return { error: '월별 매출 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * Get order status distribution
 */
export async function getOrderStatusDistribution(): Promise<
  ActionResult<OrderStatusCount[]>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('orders')
      .select('status')
      .eq('user_id', user.id);

    if (error) {
      console.error('[getOrderStatusDistribution] Query error:', error);
      return { error: error.message };
    }

    // Count by status
    const statusCounts: Record<string, number> = {};
    data?.forEach((order) => {
      const status = order.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const result: OrderStatusCount[] = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status,
        count,
      })
    );

    return { data: result };
  } catch (err) {
    console.error('[getOrderStatusDistribution] Unexpected error:', err);
    return { error: '상태별 분포 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * Get quarterly comparison for a given year
 */
export async function getQuarterlyComparison(
  year: number
): Promise<ActionResult<QuarterlyData[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data, error } = await supabase
      .from('orders')
      .select('confirmed_amount, revenue_confirmed_at')
      .eq('user_id', user.id)
      .not('confirmed_amount', 'is', null)
      .gte('revenue_confirmed_at', startDate)
      .lte('revenue_confirmed_at', endDate);

    if (error) {
      console.error('[getQuarterlyComparison] Query error:', error);
      return { error: error.message };
    }

    // Aggregate by quarter
    const quarterlyData: Record<string, number> = {
      'Q1': 0,
      'Q2': 0,
      'Q3': 0,
      'Q4': 0,
    };

    data?.forEach((order) => {
      if (order.revenue_confirmed_at && order.confirmed_amount) {
        const month = new Date(order.revenue_confirmed_at).getMonth() + 1;
        const quarter = Math.ceil(month / 3);
        quarterlyData[`Q${quarter}`] += order.confirmed_amount;
      }
    });

    const result: QuarterlyData[] = Object.entries(quarterlyData).map(
      ([quarter, revenue]) => ({
        quarter,
        revenue,
      })
    );

    return { data: result };
  } catch (err) {
    console.error('[getQuarterlyComparison] Unexpected error:', err);
    return { error: '분기별 비교 조회 중 오류가 발생했습니다.' };
  }
}

/**
 * Get top customers by revenue
 */
export async function getTopCustomers(
  limit: number = 10
): Promise<ActionResult<TopCustomer[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('orders')
      .select('customer_id, confirmed_amount, customers(name)')
      .eq('user_id', user.id)
      .not('confirmed_amount', 'is', null)
      .not('customer_id', 'is', null);

    if (error) {
      console.error('[getTopCustomers] Query error:', error);
      return { error: error.message };
    }

    // Aggregate by customer
    const customerData: Record<
      string,
      { name: string; total: number; count: number }
    > = {};

    data?.forEach((order: any) => {
      if (order.customer_id && order.confirmed_amount) {
        if (!customerData[order.customer_id]) {
          customerData[order.customer_id] = {
            name: order.customers?.name || '알 수 없음',
            total: 0,
            count: 0,
          };
        }
        customerData[order.customer_id].total += order.confirmed_amount;
        customerData[order.customer_id].count += 1;
      }
    });

    // Sort by total revenue and take top N
    const result: TopCustomer[] = Object.entries(customerData)
      .map(([customer_id, data]) => ({
        customer_id,
        customer_name: data.name,
        total_revenue: data.total,
        order_count: data.count,
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);

    return { data: result };
  } catch (err) {
    console.error('[getTopCustomers] Unexpected error:', err);
    return { error: '고객 순위 조회 중 오류가 발생했습니다.' };
  }
}
