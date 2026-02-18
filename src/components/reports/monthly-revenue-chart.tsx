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
import type { MonthlyRevenue } from '@/app/(dashboard)/reports/actions';

interface MonthlyRevenueChartProps {
  data: MonthlyRevenue[];
  year: number;
}

const MONTH_NAMES = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
];

export function MonthlyRevenueChart({ data, year }: MonthlyRevenueChartProps) {
  const chartData = data.map((item) => ({
    month: MONTH_NAMES[item.month - 1],
    revenue: item.revenue,
  }));

  const formatCurrency = (value: number) => {
    return `${(value / 10000).toFixed(0)}만`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>월별 매출 ({year}년)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip
              formatter={(value) => `${Number(value).toLocaleString()}원`}
            />
            <Bar dataKey="revenue" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
