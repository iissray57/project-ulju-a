import { Font } from '@react-pdf/renderer';
import path from 'path';

/**
 * PDF 한글 폰트 등록
 * Pretendard OTF를 @react-pdf/renderer에 등록
 */
export function registerPDFKoreanFonts() {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');

  Font.register({
    family: 'Pretendard',
    fonts: [
      { src: path.join(fontsDir, 'Pretendard-Regular.otf'), fontWeight: 'normal' },
      { src: path.join(fontsDir, 'Pretendard-SemiBold.otf'), fontWeight: 600 },
      { src: path.join(fontsDir, 'Pretendard-Bold.otf'), fontWeight: 'bold' },
    ],
  });
}

/**
 * PDF 기본 폰트
 */
export const PDF_FONT_FAMILY = 'Pretendard';
export const PDF_FALLBACK_FONT = 'Pretendard';
