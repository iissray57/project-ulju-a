import { View, Text } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { pdfStyles } from './styles';

/**
 * PDF Header 컴포넌트
 */
interface PDFHeaderProps {
  title: string;
  subtitle?: string;
  date?: string;
  logo?: string; // 향후 이미지 URL 추가 가능
}

export function PDFHeader({ title, subtitle, date }: PDFHeaderProps) {
  return (
    <View style={pdfStyles.header}>
      <View style={pdfStyles.headerRow}>
        <View>
          <Text style={pdfStyles.h1}>{title}</Text>
          {subtitle && <Text style={pdfStyles.body}>{subtitle}</Text>}
        </View>
        <View>
          {date && <Text style={pdfStyles.caption}>{date}</Text>}
        </View>
      </View>
    </View>
  );
}

/**
 * PDF Footer 컴포넌트
 */
interface PDFFooterProps {
  pageNumber: number;
  totalPages?: number;
  companyName?: string;
}

export function PDFFooter({ pageNumber, totalPages, companyName = 'ClosetBiz' }: PDFFooterProps) {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text>
        {companyName} | Page {pageNumber}
        {totalPages ? ` of ${totalPages}` : ''}
      </Text>
    </View>
  );
}

/**
 * PDF Table 컴포넌트
 */
interface PDFTableColumn {
  header: string;
  key: string;
  width?: number; // flex weight (default: 1)
  align?: 'left' | 'center' | 'right';
}

interface PDFTableProps {
  columns: PDFTableColumn[];
  rows: Record<string, string | number>[];
  style?: Style;
}

export function PDFTable({ columns, rows, style }: PDFTableProps) {
  return (
    <View style={style ? [pdfStyles.table, style] : pdfStyles.table}>
      {/* Header */}
      <View style={pdfStyles.tableHeaderRow}>
        {columns.map((col) => {
          const cellStyle: Style[] = [
            pdfStyles.tableCellHeader,
            { flex: col.width ?? 1 },
          ];
          if (col.align === 'center') {
            cellStyle.push({ textAlign: 'center' });
          } else if (col.align === 'right') {
            cellStyle.push({ textAlign: 'right' });
          }
          return (
            <Text key={col.key} style={cellStyle}>
              {col.header}
            </Text>
          );
        })}
      </View>

      {/* Rows */}
      {rows.map((row, idx) => (
        <View key={idx} style={pdfStyles.tableRow}>
          {columns.map((col) => {
            const cellStyle: Style[] = [
              pdfStyles.tableCell,
              { flex: col.width ?? 1 },
            ];
            if (col.align === 'center') {
              cellStyle.push({ textAlign: 'center' });
            } else if (col.align === 'right') {
              cellStyle.push({ textAlign: 'right' });
            }
            return (
              <Text key={col.key} style={cellStyle}>
                {row[col.key] ?? ''}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * PDF Section 컴포넌트
 */
interface PDFSectionProps {
  title?: string;
  children?: React.ReactNode;
  style?: Style;
}

export function PDFSection({ title, children, style }: PDFSectionProps) {
  return (
    <View style={style ? [pdfStyles.section, style] : pdfStyles.section}>
      {title && <Text style={pdfStyles.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
}

/**
 * PDF Row 컴포넌트 (key-value 표시)
 */
interface PDFRowProps {
  label: string;
  value: string | number;
  style?: Style;
}

export function PDFRow({ label, value, style }: PDFRowProps) {
  return (
    <View style={style ? [pdfStyles.row, style] : pdfStyles.row}>
      <Text style={pdfStyles.body}>{label}</Text>
      <Text style={pdfStyles.bodyBold}>{value}</Text>
    </View>
  );
}

/**
 * PDF Divider 컴포넌트
 */
export function PDFDivider() {
  return <View style={pdfStyles.divider} />;
}

/**
 * PDF Spacer 컴포넌트
 */
export function PDFSpacer() {
  return <View style={pdfStyles.spacer} />;
}
