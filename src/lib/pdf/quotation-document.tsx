import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles, PDF_COLORS } from './styles';
import { PDFHeader, PDFFooter, PDFTable, PDFSection, PDFRow, PDFDivider } from './components';
import { formatPhone } from '@/lib/utils';

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
  modelImages?: Array<{
    name: string;
    thumbnail_url: string | null;
    elevation_image_url: string | null;
    three_d_image_url: string | null;
  }>;
  componentSummary?: Array<{
    category: string;
    presetType: string | null;
    width: number;
    count: number;
    cornerType: string | null;
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
  const { order, customer, materials, modelImages, componentSummary } = data;

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
        React.createElement(PDFRow, { label: '연락처', value: formatPhone(customer.phone) }),
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

      // 모델 이미지 섹션
      modelImages && modelImages.length > 0
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement(
              PDFSection,
              { title: '배치도' },
              ...modelImages.flatMap((img, idx) => {
                const images: React.ReactElement[] = [];

                // 모델 이름 헤더
                images.push(
                  React.createElement(
                    Text,
                    { key: `title-${idx}`, style: [pdfStyles.bodyBold, { marginBottom: 4, marginTop: idx > 0 ? 12 : 0 }] },
                    img.name
                  )
                );

                // 평면도
                if (img.thumbnail_url) {
                  images.push(
                    React.createElement(
                      View,
                      { key: `plan-${idx}`, style: { marginBottom: 6 } },
                      React.createElement(
                        Text,
                        { style: [pdfStyles.caption, { marginBottom: 2 }] },
                        '평면도'
                      ),
                      React.createElement(Image, {
                        src: img.thumbnail_url,
                        style: { width: '100%', maxHeight: 180, objectFit: 'contain' },
                      })
                    )
                  );
                }

                // 입면도
                if (img.elevation_image_url) {
                  images.push(
                    React.createElement(
                      View,
                      { key: `elev-${idx}`, style: { marginBottom: 6 } },
                      React.createElement(
                        Text,
                        { style: [pdfStyles.caption, { marginBottom: 2 }] },
                        '입면도'
                      ),
                      React.createElement(Image, {
                        src: img.elevation_image_url,
                        style: { width: '100%', maxHeight: 180, objectFit: 'contain' },
                      })
                    )
                  );
                }

                // 3D 모형 (선택)
                if (img.three_d_image_url) {
                  images.push(
                    React.createElement(
                      View,
                      { key: `3d-${idx}`, style: { marginBottom: 6 } },
                      React.createElement(
                        Text,
                        { style: [pdfStyles.caption, { marginBottom: 2 }] },
                        '3D 모형'
                      ),
                      React.createElement(Image, {
                        src: img.three_d_image_url,
                        style: { width: '100%', maxHeight: 180, objectFit: 'contain' },
                      })
                    )
                  );
                }

                return images;
              })
            ),
            React.createElement(PDFDivider, null)
          )
        : null,

      // 가구 구성 섹션
      componentSummary && componentSummary.length > 0
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement(
              PDFSection,
              { title: '가구 구성' },
              React.createElement(PDFTable, {
                columns: [
                  { header: '가구종류', key: 'category', width: 2 },
                  { header: '타입', key: 'presetType', width: 1, align: 'center' as const },
                  { header: '너비(mm)', key: 'width', width: 1.5, align: 'right' as const },
                  { header: '수량', key: 'count', width: 1, align: 'center' as const },
                  { header: '비고', key: 'note', width: 1.5 },
                ],
                rows: componentSummary.map((s) => ({
                  category: s.category,
                  presetType: s.presetType || '-',
                  width: s.width.toString(),
                  count: s.count.toString(),
                  note: s.cornerType ? `${s.cornerType === 'L' ? 'ㄱ자' : 'ㄴ자'} 코너` : '-',
                })),
              })
            ),
            React.createElement(PDFDivider, null)
          )
        : null,

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
        companyName: '울주앵글',
      })
    )
  );
}
