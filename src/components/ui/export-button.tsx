'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import { exportToCSV, exportToExcel, type ExportColumn } from '@/lib/utils/export';

interface ExportButtonProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  sheetName?: string;
}

export function ExportButton<T>({
  data,
  columns,
  filename,
  sheetName,
}: ExportButtonProps<T>) {
  if (data.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="size-4 mr-1.5" />
          내보내기
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportToCSV(data, columns, filename)}>
          CSV 다운로드
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToExcel(data, columns, filename, sheetName)}>
          Excel 다운로드
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
