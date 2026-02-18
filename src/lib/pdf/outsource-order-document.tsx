import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles, PDF_COLORS } from './styles';
import { PDFHeader, PDFFooter, PDFSection, PDFRow, PDFDivider } from './components';
import { formatPhone } from '@/lib/utils';

/**
 * 외주 발주서 데이터 타입
 */
export interface OutsourceOrderPDFData {
  outsourceOrder: {
    outsource_number: string;
    outsource_type: 'system' | 'curtain';
    spec_summary: string | null;
    memo: string | null;
    plan_image_url: string | null;
    elevation_image_url: string | null;
    amount: number;
    requested_date: string | null;
    due_date: string | null;
  };
  supplier: {
    name: string;
    phone: string | null;
  } | null;
  customer: {
    name: string;
    address: string | null;
  };
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
 * 외주 유형 라벨
 */
function getOutsourceTypeLabel(type: 'system' | 'curtain'): string {
  return type === 'system' ? '시스템장' : '커튼';
}

/**
 * 외주 발주서 PDF 문서 생성
 * @param data - OutsourceOrderPDFData
 * @returns React.ReactElement (React.createElement 사용, JSX 금지)
 */
export function generateOutsourceOrderDocument(data: OutsourceOrderPDFData) {
  const { outsourceOrder, supplier, customer } = data;

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: pdfStyles.page },

      // 헤더
      React.createElement(PDFHeader, {
        title: '외주 발주서',
        subtitle: 'OUTSOURCE ORDER',
        date: formatDate(outsourceOrder.requested_date),
      }),

      // 발주 정보 섹션
      React.createElement(
        PDFSection,
        { title: '발주 정보' },
        React.createElement(PDFRow, {
          label: '발주번호',
          value: outsourceOrder.outsource_number,
        }),
        React.createElement(PDFRow, {
          label: '발주일',
          value: formatDate(outsourceOrder.requested_date),
        }),
        React.createElement(PDFRow, {
          label: '납기예정일',
          value: formatDate(outsourceOrder.due_date),
        })
      ),

      React.createElement(PDFDivider, null),

      // 거래처 정보 섹션
      React.createElement(
        PDFSection,
        { title: '거래처 정보' },
        React.createElement(PDFRow, {
          label: '거래처명',
          value: supplier ? supplier.name : '-',
        }),
        React.createElement(PDFRow, {
          label: '연락처',
          value: supplier?.phone ? formatPhone(supplier.phone) : '-',
        })
      ),

      React.createElement(PDFDivider, null),

      // 고객/현장 정보 섹션
      React.createElement(
        PDFSection,
        { title: '고객/현장 정보' },
        React.createElement(PDFRow, {
          label: '고객명',
          value: customer.name,
        }),
        React.createElement(PDFRow, {
          label: '현장 주소',
          value: customer.address || '-',
        })
      ),

      React.createElement(PDFDivider, null),

      // 제작 스펙 섹션
      React.createElement(
        PDFSection,
        { title: '제작 스펙' },
        React.createElement(PDFRow, {
          label: '외주 유형',
          value: getOutsourceTypeLabel(outsourceOrder.outsource_type),
        }),
        outsourceOrder.spec_summary
          ? React.createElement(
              View,
              { style: { marginBottom: 6 } },
              React.createElement(
                Text,
                { style: [pdfStyles.body, { marginBottom: 4 }] },
                '사이즈/색상 요약'
              ),
              React.createElement(
                View,
                {
                  style: {
                    padding: 8,
                    backgroundColor: '#f8fafc',
                    borderRadius: 4,
                    border: `1pt solid ${PDF_COLORS.border}`,
                  },
                },
                React.createElement(
                  Text,
                  { style: pdfStyles.body },
                  outsourceOrder.spec_summary
                )
              )
            )
          : React.createElement(PDFRow, {
              label: '사이즈/색상 요약',
              value: '-',
            }),
        outsourceOrder.memo
          ? React.createElement(
              View,
              { style: { marginTop: 8 } },
              React.createElement(
                Text,
                { style: [pdfStyles.body, { marginBottom: 4 }] },
                '특이사항'
              ),
              React.createElement(
                View,
                {
                  style: {
                    padding: 8,
                    backgroundColor: '#fffbeb',
                    borderRadius: 4,
                    border: `1pt solid #fde68a`,
                  },
                },
                React.createElement(
                  Text,
                  { style: pdfStyles.body },
                  outsourceOrder.memo
                )
              )
            )
          : null
      ),

      // 도면 이미지 섹션 (URL이 있을 때만 표시)
      outsourceOrder.plan_image_url || outsourceOrder.elevation_image_url
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement(PDFDivider, null),
            React.createElement(
              PDFSection,
              { title: '도면' },
              outsourceOrder.plan_image_url
                ? React.createElement(
                    View,
                    { style: { marginBottom: 12 } },
                    React.createElement(
                      Text,
                      { style: [pdfStyles.caption, { marginBottom: 4 }] },
                      '평면도'
                    ),
                    React.createElement(Image, {
                      src: outsourceOrder.plan_image_url,
                      style: { width: '100%', maxHeight: 200, objectFit: 'contain' },
                    })
                  )
                : null,
              outsourceOrder.elevation_image_url
                ? React.createElement(
                    View,
                    { style: { marginBottom: 6 } },
                    React.createElement(
                      Text,
                      { style: [pdfStyles.caption, { marginBottom: 4 }] },
                      '입면도'
                    ),
                    React.createElement(Image, {
                      src: outsourceOrder.elevation_image_url,
                      style: { width: '100%', maxHeight: 200, objectFit: 'contain' },
                    })
                  )
                : null
            )
          )
        : null,

      React.createElement(PDFDivider, null),

      // 금액 섹션
      React.createElement(
        PDFSection,
        { title: '금액' },
        React.createElement(
          View,
          {
            style: [
              pdfStyles.row,
              {
                paddingTop: 8,
                paddingBottom: 8,
                borderTop: `2pt solid ${PDF_COLORS.border}`,
                borderBottom: `2pt solid ${PDF_COLORS.border}`,
              },
            ],
          },
          React.createElement(
            Text,
            { style: [pdfStyles.h3, { marginBottom: 0 }] },
            '외주비'
          ),
          React.createElement(
            Text,
            { style: [pdfStyles.h3, { marginBottom: 0 }] },
            formatCurrency(outsourceOrder.amount)
          )
        )
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
