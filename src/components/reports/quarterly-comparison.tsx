'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { QuarterlyData } from '@/app/(dashboard)/reports/actions';

interface QuarterlyComparisonProps {
  data: QuarterlyData[];
}

export function QuarterlyComparison({ data }: QuarterlyComparisonProps) {
  const formatCurrency = (value: number) => {
    return `${(value / 10000).toFixed(0)}만`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>분기별 매출 비교</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="quarter" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip
              formatter={(value) => `${Number(value).toLocaleString()}원`}
            />
            <Bar dataKey="revenue" fill="#7c3aed" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
