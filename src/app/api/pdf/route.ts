import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { Document, Page, View, Text, renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { registerPDFKoreanFonts } from '@/lib/pdf/fonts';
import { pdfStyles } from '@/lib/pdf/styles';
import { PDFHeader, PDFFooter, PDFTable, PDFSection, PDFRow, PDFDivider } from '@/lib/pdf/components';

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

    // 추후 quotation, invoice 등 타입별 PDF 생성
    if (type === 'quotation' && orderId) {
      // T6.2에서 구현 예정
      return NextResponse.json({ error: 'Not implemented yet' }, { status: 501 });
    }

    return NextResponse.json({ error: 'Invalid type or missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
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
