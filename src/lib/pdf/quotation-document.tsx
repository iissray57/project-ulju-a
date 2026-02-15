import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles, PDF_COLORS } from './styles';
import { PDFHeader, PDFFooter, PDFTable, PDFSection, PDFRow, PDFDivider } from './components';

/**
 * 견적서 데이터 타입
 */
export interface QuotationData {
  order: {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    installation_date: string | null;
    notes: string | null;
    created_at: string;
  };
  customer: {
    name: string;
    phone: string;
    address: string | null;
  };
  materials: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    memo: string | null;
  }>;
}

/**
 * 금액 포맷팅 (3자리마다 쉼표)
 */
function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 날짜 포맷팅
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 견적서 PDF 문서 생성
 * @param data - QuotationData
 * @returns React.ReactElement (React.createElement 사용, JSX 금지)
 */
export function generateQuotationDocument(data: QuotationData) {
  const { order, customer, materials } = data;

  // 금액 계산
  const subtotal = order.total_amount;
  const vatRate = 0.1;
  const vat = Math.round(subtotal * vatRate);
  const grandTotal = subtotal + vat;

  // 자재 목록 테이블 데이터
  const materialRows = materials.map((m) => ({
    product_name: m.product_name,
    quantity: m.quantity.toString(),
    unit_price: formatCurrency(m.unit_price),
    subtotal: formatCurrency(m.subtotal),
  }));

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: pdfStyles.page },

      // 헤더
      React.createElement(PDFHeader, {
        title: '견적서',
        subtitle: 'QUOTATION',
        date: formatDate(order.created_at),
      }),

      // 고객 정보 섹션
      React.createElement(
        PDFSection,
        { title: '고객 정보' },
        React.createElement(PDFRow, { label: '고객명', value: customer.name }),
        React.createElement(PDFRow, { label: '연락처', value: customer.phone }),
        React.createElement(PDFRow, {
          label: '주소',
          value: customer.address || '-',
        })
      ),

      React.createElement(PDFDivider, null),

      // 주문 정보 섹션
      React.createElement(
        PDFSection,
        { title: '주문 정보' },
        React.createElement(PDFRow, {
          label: '견적번호',
          value: order.order_number,
        }),
        React.createElement(PDFRow, { label: '상태', value: order.status }),
        React.createElement(PDFRow, {
          label: '설치예정일',
          value: formatDate(order.installation_date),
        })
      ),

      React.createElement(PDFDivider, null),

      // 자재 목록 테이블
      React.createElement(
        PDFSection,
        { title: '자재 목록' },
        React.createElement(PDFTable, {
          columns: [
            { header: '품목', key: 'product_name', width: 3 },
            { header: '수량', key: 'quantity', width: 1, align: 'center' as const },
            { header: '단가', key: 'unit_price', width: 1.5, align: 'right' as const },
            { header: '소계', key: 'subtotal', width: 1.5, align: 'right' as const },
          ],
          rows: materialRows,
        })
      ),

      React.createElement(PDFDivider, null),

      // 금액 요약 섹션
      React.createElement(
        PDFSection,
        { title: '금액 요약' },
        React.createElement(
          View,
          { style: pdfStyles.row },
          React.createElement(Text, { style: pdfStyles.body }, '소계'),
          React.createElement(Text, { style: pdfStyles.bodyBold }, formatCurrency(subtotal))
        ),
        React.createElement(
          View,
          { style: pdfStyles.row },
          React.createElement(Text, { style: pdfStyles.body }, '부가세 (10%)'),
          React.createElement(Text, { style: pdfStyles.bodyBold }, formatCurrency(vat))
        ),
        React.createElement(
          View,
          {
            style: [
              pdfStyles.row,
              {
                marginTop: 8,
                paddingTop: 8,
                borderTop: `2pt solid ${PDF_COLORS.border}`,
              },
            ],
          },
          React.createElement(
            Text,
            { style: [pdfStyles.h3, { marginBottom: 0 }] },
            '총 금액'
          ),
          React.createElement(
            Text,
            { style: [pdfStyles.h3, { marginBottom: 0 }] },
            formatCurrency(grandTotal)
          )
        )
      ),

      React.createElement(PDFDivider, null),

      // 비고 섹션
      React.createElement(
        PDFSection,
        { title: '비고' },
        React.createElement(
          Text,
          { style: pdfStyles.body },
          '• 견적 유효기간: 발행일로부터 30일'
        ),
        React.createElement(
          Text,
          { style: pdfStyles.body },
          '• 제품 사양 및 가격은 협의 후 변경될 수 있습니다.'
        ),
        React.createElement(
          Text,
          { style: pdfStyles.body },
          '• 설치비 및 운송비는 별도 협의됩니다.'
        ),
        order.notes
          ? React.createElement(
              Text,
              { style: [pdfStyles.body, { marginTop: 8 }] },
              `참고사항: ${order.notes}`
            )
          : null
      ),

      // 푸터
      React.createElement(PDFFooter, {
        pageNumber: 1,
        totalPages: 1,
        companyName: 'ClosetBiz',
      })
    )
  );
}
