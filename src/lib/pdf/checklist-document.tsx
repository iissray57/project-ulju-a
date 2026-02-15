import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles, PDF_COLORS } from './styles';
import { PDFHeader, PDFFooter, PDFSection, PDFRow, PDFDivider } from './components';
import type { ChecklistItem } from '@/lib/schemas/checklist';

interface ChecklistPDFData {
  order: {
    order_number: string;
    installation_date: string | null;
    created_at: string;
  };
  customer: {
    name: string;
    phone: string;
  };
  preparation: ChecklistItem[];
  installation: ChecklistItem[];
}

/**
 * 체크리스트 PDF 문서 생성
 * React.createElement() 사용 (JSX 금지)
 */
export function createChecklistDocument(data: ChecklistPDFData) {
  const issueDate = new Date().toLocaleDateString('ko-KR');
  const installDate = data.order.installation_date
    ? new Date(data.order.installation_date).toLocaleDateString('ko-KR')
    : '미정';

  // 완료율 계산
  const prepChecked = data.preparation.filter((item) => item.checked).length;
  const prepTotal = data.preparation.length;
  const instChecked = data.installation.filter((item) => item.checked).length;
  const instTotal = data.installation.length;
  const totalChecked = prepChecked + instChecked;
  const totalItems = prepTotal + instTotal;
  const completionRate = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  // 미완료 항목 목록
  const incompleteItems = [
    ...data.preparation.filter((item) => !item.checked).map((item) => `[준비] ${item.label}`),
    ...data.installation.filter((item) => !item.checked).map((item) => `[설치] ${item.label}`),
  ];

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: pdfStyles.page },
      // Header
      React.createElement(PDFHeader, {
        title: '체크리스트 점검 결과',
        subtitle: `주문번호: ${data.order.order_number}`,
        date: `발행일: ${issueDate}`,
      }),

      // 고객 정보 섹션
      React.createElement(
        PDFSection,
        { title: '고객 정보' },
        React.createElement(PDFRow, { label: '고객명', value: data.customer.name }),
        React.createElement(PDFRow, { label: '연락처', value: data.customer.phone }),
        React.createElement(PDFRow, { label: '설치예정일', value: installDate })
      ),

      React.createElement(PDFDivider, null),

      // 준비 체크리스트 섹션
      React.createElement(
        PDFSection,
        { title: `1. 준비 체크리스트 (${prepChecked}/${prepTotal} 완료)` },
        ...data.preparation.map((item) =>
          React.createElement(
            View,
            { key: item.id, style: { marginBottom: 8 } },
            React.createElement(
              View,
              { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 } },
              React.createElement(
                Text,
                { style: [pdfStyles.body, { width: 30 }] },
                item.checked ? '[X]' : '[ ]'
              ),
              React.createElement(Text, { style: pdfStyles.body }, item.label)
            ),
            item.note
              ? React.createElement(
                  Text,
                  { style: [pdfStyles.caption, { marginLeft: 30 }] },
                  `비고: ${item.note}`
                )
              : null
          )
        )
      ),

      React.createElement(PDFDivider, null),

      // 설치 체크리스트 섹션
      React.createElement(
        PDFSection,
        { title: `2. 설치 체크리스트 (${instChecked}/${instTotal} 완료)` },
        ...data.installation.map((item) =>
          React.createElement(
            View,
            { key: item.id, style: { marginBottom: 8 } },
            React.createElement(
              View,
              { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 } },
              React.createElement(
                Text,
                { style: [pdfStyles.body, { width: 30 }] },
                item.checked ? '[X]' : '[ ]'
              ),
              React.createElement(Text, { style: pdfStyles.body }, item.label)
            ),
            item.note
              ? React.createElement(
                  Text,
                  { style: [pdfStyles.caption, { marginLeft: 30 }] },
                  `비고: ${item.note}`
                )
              : null
          )
        )
      ),

      React.createElement(PDFDivider, null),

      // 요약 섹션
      React.createElement(
        PDFSection,
        { title: '3. 요약' },
        React.createElement(PDFRow, { label: '전체 완료율', value: `${completionRate}%` }),
        React.createElement(PDFRow, {
          label: '미완료 항목 수',
          value: incompleteItems.length.toString(),
        }),
        incompleteItems.length > 0
          ? React.createElement(
              View,
              { style: { marginTop: 12 } },
              React.createElement(Text, { style: [pdfStyles.body, { marginBottom: 6 }] }, '미완료 항목:'),
              ...incompleteItems.map((itemLabel, idx) =>
                React.createElement(
                  Text,
                  { key: idx, style: [pdfStyles.caption, { marginLeft: 12, marginBottom: 3 }] },
                  `• ${itemLabel}`
                )
              )
            )
          : React.createElement(
              Text,
              { style: [pdfStyles.body, { marginTop: 8, color: PDF_COLORS.primary }] },
              '모든 항목이 완료되었습니다.'
            )
      ),

      React.createElement(PDFDivider, null),

      // 서명란 섹션
      React.createElement(
        PDFSection,
        { title: '4. 서명' },
        React.createElement(
          View,
          { style: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 } },
          React.createElement(
            View,
            { style: { width: 200, alignItems: 'center' } },
            React.createElement(Text, { style: pdfStyles.body }, '작업자 서명'),
            React.createElement(View, {
              style: {
                marginTop: 40,
                borderBottom: '1pt solid #000',
                width: 150,
              },
            })
          ),
          React.createElement(
            View,
            { style: { width: 200, alignItems: 'center' } },
            React.createElement(Text, { style: pdfStyles.body }, '고객 서명'),
            React.createElement(View, {
              style: {
                marginTop: 40,
                borderBottom: '1pt solid #000',
                width: 150,
              },
            })
          )
        )
      ),

      // Footer
      React.createElement(PDFFooter, {
        pageNumber: 1,
        totalPages: 1,
        companyName: 'ClosetBiz',
      })
    )
  );
}
