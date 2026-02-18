'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { OrderStatusCount } from '@/app/(dashboard)/reports/actions';

interface OrderStatusPieProps {
  data: OrderStatusCount[];
}

const STATUS_LABELS: Record<string, string> = {
  inquiry: '상담',
  quotation_sent: '견적발송',
  confirmed: '계약완료',
  measurement_done: '실측완료',
  date_fixed: '일정확정',
  material_held: '자재보유',
  installed: '시공완료',
  settlement_wait: '정산대기',
  revenue_confirmed: '매출확정',
  cancelled: '취소',
};

const COLORS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#65a30d',
  '#059669',
  '#0891b2',
  '#6366f1',
];

export function OrderStatusPie({ data }: OrderStatusPieProps) {
  const chartData = data.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>주문 상태별 분포</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${((percent || 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
