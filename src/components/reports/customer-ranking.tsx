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
import type { TopCustomer } from '@/app/(dashboard)/reports/actions';

interface CustomerRankingProps {
  data: TopCustomer[];
}

export function CustomerRanking({ data }: CustomerRankingProps) {
  const chartData = data.map((item) => ({
    name: item.customer_name,
    revenue: item.total_revenue,
    count: item.order_count,
  }));

  const formatCurrency = (value: number) => {
    return `${(value / 10000).toFixed(0)}만`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>고객별 매출 순위 (Top 10)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatCurrency} />
            <YAxis type="category" dataKey="name" width={100} />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'revenue') {
                  return [`${Number(value).toLocaleString()}원`, '매출'];
                }
                return [Number(value), '주문 수'];
              }}
            />
            <Bar dataKey="revenue" fill="#059669" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
