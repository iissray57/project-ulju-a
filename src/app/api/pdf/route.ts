import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { Document, Page, View, Text, renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { registerPDFKoreanFonts } from '@/lib/pdf/fonts';
import { pdfStyles } from '@/lib/pdf/styles';
import { PDFHeader, PDFFooter, PDFTable, PDFSection, PDFRow, PDFDivider } from '@/lib/pdf/components';
import {
  generateQuotationDocument,
  type QuotationData,
} from '@/lib/pdf/quotation-document';
import { createChecklistDocument } from '@/lib/pdf/checklist-document';
import {
  DEFAULT_PREPARATION_CHECKLIST,
  DEFAULT_INSTALLATION_CHECKLIST,
  type ChecklistItem,
} from '@/lib/schemas/checklist';

// 한글 폰트 등록
registerPDFKoreanFonts();

/**
 * PDF 생성 Route Handler
 * GET /api/pdf?type=quotation&orderId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // Query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'test';
    const orderId = searchParams.get('orderId');

    // 현재는 테스트 PDF만 생성 (Auth 체크 생략)
    if (type === 'test') {
      const pdfBuffer = await generateTestPDF();

      return new NextResponse(pdfBuffer as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="test-korean.pdf"',
        },
      });
    }

    // Auth 체크 (quotation, invoice 등)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // quotation PDF 생성
    if (type === 'quotation' && orderId) {
      const quotationResult = await generateQuotationPDF(supabase, user.id, orderId);

      if ('error' in quotationResult) {
        return NextResponse.json({ error: quotationResult.error }, { status: 400 });
      }

      // 한글 파일명 UTF-8 인코딩 처리
      const encodedFilename = encodeURIComponent(quotationResult.filename);
      return new NextResponse(quotationResult.buffer as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        },
      });
    }

    // checklist PDF 생성
    if (type === 'checklist' && orderId) {
      const checklistResult = await generateChecklistPDF(supabase, user.id, orderId);

      if ('error' in checklistResult) {
        return NextResponse.json({ error: checklistResult.error }, { status: 400 });
      }

      // 한글 파일명 UTF-8 인코딩 처리
      const encodedChecklistFilename = encodeURIComponent(checklistResult.filename);
      return new NextResponse(checklistResult.buffer as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedChecklistFilename}`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid type or missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('PDF generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json({ error: `PDF generation failed: ${errorMessage}` }, { status: 500 });
  }
}

/**
 * 견적서 PDF 생성
 * @param supabase - Supabase client
 * @param userId - 사용자 ID
 * @param orderId - 주문 ID
 * @returns { buffer, filename } 또는 { error }
 */
async function generateQuotationPDF(
  supabase: SupabaseClient,
  userId: string,
  orderId: string
): Promise<{ buffer: Buffer; filename: string } | { error: string }> {
  try {
    // 주문 + 고객 정보 조회 (RLS가 user_id 필터링 처리)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        id,
        order_number,
        status,
        quotation_amount,
        confirmed_amount,
        installation_date,
        memo,
        created_at,
        customer:customers(name, phone, address)
      `
      )
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      console.error('[generateQuotationPDF] Order fetch error:', orderError, 'orderId:', orderId, 'userId:', userId);
      return { error: '주문을 찾을 수 없습니다. 권한이 없거나 존재하지 않는 주문입니다.' };
    }

    // customer가 배열로 반환되므로 첫 번째 요소 사용
    const customerData = Array.isArray(orderData.customer)
      ? orderData.customer[0]
      : orderData.customer;

    if (!customerData || typeof customerData !== 'object') {
      return { error: '고객 정보를 찾을 수 없습니다.' };
    }

    // Type assertion after runtime check with null safety
    const customer = {
      name: (customerData as Record<string, unknown>).name as string || '(이름 없음)',
      phone: (customerData as Record<string, unknown>).phone as string || '',
      address: (customerData as Record<string, unknown>).address as string || null,
    };

    // 자재 목록 조회 (order_materials에 created_at 없음)
    const { data: materialsData, error: materialsError } = await supabase
      .from('order_materials')
      .select('id, product_id, planned_quantity, used_quantity, memo, product:products(name, unit_price)')
      .eq('order_id', orderId);

    if (materialsError) {
      console.error('[generateQuotationPDF] Materials fetch error:', materialsError);
      return { error: '자재 목록 조회에 실패했습니다.' };
    }

    // 자재 데이터를 QuotationData 형식으로 변환
    const materials = (materialsData || []).map((m) => {
      const product = Array.isArray(m.product) ? m.product[0] : m.product;
      const unitPrice = product?.unit_price || 0;
      const quantity = m.planned_quantity || 0;
      return {
        product_name: product?.name || '(제품 없음)',
        quantity,
        unit_price: unitPrice,
        subtotal: unitPrice * quantity,
        memo: m.memo,
      };
    });

    // QuotationData 구성
    const quotationData: QuotationData = {
      order: {
        id: orderData.id,
        order_number: orderData.order_number,
        status: orderData.status,
        total_amount: orderData.confirmed_amount || orderData.quotation_amount || 0,
        installation_date: orderData.installation_date,
        notes: orderData.memo,
        created_at: orderData.created_at,
      },
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      },
      materials,
    };

    // PDF 문서 생성
    const document = generateQuotationDocument(quotationData);
    const buffer = await renderToBuffer(document);

    const filename = `견적서_${orderData.order_number}.pdf`;

    return { buffer, filename };
  } catch (err) {
    console.error('[generateQuotationPDF] Unexpected error:', err);
    return { error: 'PDF 생성 중 오류가 발생했습니다.' };
  }
}

/**
 * 테스트 PDF 생성
 * 한글 폰트가 정상 렌더링되는지 확인
 */
async function generateTestPDF() {
  const TestDocument = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: pdfStyles.page },
      React.createElement(PDFHeader, {
        title: '한글 PDF 테스트',
        subtitle: 'ClosetBiz 견적서 시스템',
        date: new Date().toLocaleDateString('ko-KR'),
      }),
      React.createElement(
        PDFSection,
        { title: '1. 기본 정보' },
        React.createElement(PDFRow, { label: '문서 번호', value: 'TEST-2026-001' }),
        React.createElement(PDFRow, { label: '발행일', value: new Date().toLocaleDateString('ko-KR') }),
        React.createElement(PDFRow, { label: '고객명', value: '테스트 고객' }),
        React.createElement(PDFRow, { label: '연락처', value: '010-1234-5678' })
      ),
      React.createElement(PDFDivider, null),
      React.createElement(
        PDFSection,
        { title: '2. 제품 목록' },
        React.createElement(PDFTable, {
          columns: [
            { header: '품목', key: 'name', width: 3 },
            { header: '수량', key: 'quantity', width: 1, align: 'center' as const },
            { header: '단가', key: 'price', width: 1.5, align: 'right' as const },
            { header: '합계', key: 'total', width: 1.5, align: 'right' as const },
          ],
          rows: [
            {
              name: '붙박이장 (폭 2400mm × 높이 2400mm)',
              quantity: 1,
              price: '2,500,000원',
              total: '2,500,000원',
            },
            {
              name: '서랍장 (폭 800mm × 높이 1200mm)',
              quantity: 2,
              price: '450,000원',
              total: '900,000원',
            },
            {
              name: '신발장 (폭 1200mm × 높이 2000mm)',
              quantity: 1,
              price: '800,000원',
              total: '800,000원',
            },
          ],
        })
      ),
      React.createElement(PDFDivider, null),
      React.createElement(
        PDFSection,
        { title: '3. 금액 요약' },
        React.createElement(
          View,
          { style: pdfStyles.row },
          React.createElement(Text, { style: pdfStyles.body }, '소계'),
          React.createElement(Text, { style: pdfStyles.bodyBold }, '4,200,000원')
        ),
        React.createElement(
          View,
          { style: pdfStyles.row },
          React.createElement(Text, { style: pdfStyles.body }, '부가세 (10%)'),
          React.createElement(Text, { style: pdfStyles.bodyBold }, '420,000원')
        ),
        React.createElement(
          View,
          { style: [pdfStyles.row, { marginTop: 8, paddingTop: 8, borderTop: '2pt solid #e2e8f0' }] },
          React.createElement(Text, { style: [pdfStyles.h3, { marginBottom: 0 }] }, '총 금액'),
          React.createElement(Text, { style: [pdfStyles.h3, { marginBottom: 0 }] }, '4,620,000원')
        )
      ),
      React.createElement(PDFDivider, null),
      React.createElement(
        PDFSection,
        { title: '4. 비고' },
        React.createElement(Text, { style: pdfStyles.body }, '• 본 견적서는 고객님의 요청사항을 바탕으로 작성되었습니다.'),
        React.createElement(Text, { style: pdfStyles.body }, '• 제품 사양 및 가격은 협의 후 변경될 수 있습니다.'),
        React.createElement(Text, { style: pdfStyles.body }, '• 설치비 및 운송비는 별도 협의됩니다.')
      ),
      React.createElement(PDFFooter, { pageNumber: 1, totalPages: 1, companyName: 'ClosetBiz' })
    )
  );

  const buffer = await renderToBuffer(TestDocument);
  return buffer;
}

/**
 * 체크리스트 PDF 생성
 * @param supabase - Supabase client
 * @param userId - 사용자 ID
 * @param orderId - 주문 ID
 * @returns { buffer, filename } 또는 { error }
 */
async function generateChecklistPDF(
  supabase: SupabaseClient,
  userId: string,
  orderId: string
): Promise<{ buffer: Buffer; filename: string } | { error: string }> {
  try {
    // 주문 + 고객 + 체크리스트 조회 (RLS가 user_id 필터링 처리)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        id,
        order_number,
        installation_date,
        created_at,
        preparation_checklist,
        installation_checklist,
        customer:customers(name, phone)
      `
      )
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      console.error('[generateChecklistPDF] Order fetch error:', orderError, 'orderId:', orderId, 'userId:', userId);
      return { error: '주문을 찾을 수 없습니다. 권한이 없거나 존재하지 않는 주문입니다.' };
    }

    // 체크리스트 데이터 (없으면 기본값 사용)
    const preparationChecklist =
      (orderData.preparation_checklist as ChecklistItem[] | null) ?? DEFAULT_PREPARATION_CHECKLIST;
    const installationChecklist =
      (orderData.installation_checklist as ChecklistItem[] | null) ?? DEFAULT_INSTALLATION_CHECKLIST;

    // Supabase join returns array, get first element
    const rawCustomer = orderData.customer;
    const customerData = (Array.isArray(rawCustomer) ? rawCustomer[0] : rawCustomer) as unknown;

    if (!customerData || typeof customerData !== 'object') {
      console.error('[generateChecklistPDF] Customer data missing');
      return { error: '고객 정보를 찾을 수 없습니다.' };
    }

    // Type assertion after runtime check
    const customer = customerData as { name: string; phone: string };

    // PDF 문서 생성
    const document = createChecklistDocument({
      order: {
        order_number: orderData.order_number,
        installation_date: orderData.installation_date,
        created_at: orderData.created_at,
      },
      customer: {
        name: customer.name,
        phone: customer.phone,
      },
      preparation: preparationChecklist,
      installation: installationChecklist,
    });

    const buffer = await renderToBuffer(document);
    const filename = `체크리스트_${orderData.order_number}.pdf`;

    return { buffer, filename };
  } catch (err) {
    console.error('[generateChecklistPDF] Unexpected error:', err);
    return { error: 'PDF 생성 중 오류가 발생했습니다.' };
  }
}
