import { StyleSheet } from '@react-pdf/renderer';
import { PDF_FONT_FAMILY } from './fonts';

/**
 * PDF 브랜드 색상
 */
export const PDF_COLORS = {
  primary: '#2563eb', // blue-600
  secondary: '#64748b', // slate-500
  text: '#0f172a', // slate-900
  textMuted: '#64748b', // slate-500
  border: '#e2e8f0', // slate-200
  background: '#ffffff',
  headerBg: '#f8fafc', // slate-50
} as const;

/**
 * PDF 공통 스타일
 */
export const pdfStyles = StyleSheet.create({
  // Page layout
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: PDF_FONT_FAMILY,
    backgroundColor: PDF_COLORS.background,
    color: PDF_COLORS.text,
  },

  // Typography
  h1: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 12,
    color: PDF_COLORS.text,
  },
  h2: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 10,
    color: PDF_COLORS.text,
  },
  h3: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    color: PDF_COLORS.text,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.5,
    color: PDF_COLORS.text,
  },
  bodyBold: {
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.5,
    color: PDF_COLORS.text,
  },
  caption: {
    fontSize: 8,
    color: PDF_COLORS.textMuted,
  },

  // Header/Footer
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: `2pt solid ${PDF_COLORS.border}`,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: PDF_COLORS.textMuted,
    borderTop: `1pt solid ${PDF_COLORS.border}`,
    paddingTop: 8,
  },

  // Table
  table: {
    marginTop: 12,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: `1pt solid ${PDF_COLORS.border}`,
    minHeight: 28,
    alignItems: 'center',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.headerBg,
    borderBottom: `2pt solid ${PDF_COLORS.border}`,
    minHeight: 32,
    alignItems: 'center',
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    flex: 1,
  },
  tableCellHeader: {
    padding: 6,
    fontSize: 9,
    fontWeight: 600,
    flex: 1,
  },
  tableCellRight: {
    padding: 6,
    fontSize: 9,
    flex: 1,
    textAlign: 'right',
  },
  tableCellCenter: {
    padding: 6,
    fontSize: 9,
    flex: 1,
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 8,
    color: PDF_COLORS.primary,
  },

  // Utility
  divider: {
    borderBottom: `1pt solid ${PDF_COLORS.border}`,
    marginTop: 8,
    marginBottom: 8,
  },
  spacer: {
    height: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  column: {
    flexDirection: 'column',
  },
  textRight: {
    textAlign: 'right',
  },
  textCenter: {
    textAlign: 'center',
  },
  textBold: {
    fontWeight: 700,
  },
});
