"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type ChartItem = {
  name: string;
  amount: number;
};

type ExpensesChartProps = {
  data: ChartItem[];
};

export function ExpensesChart({ data }: ExpensesChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-secondary)]">
        Недостаточно данных для графика
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [
              `${Number(value).toLocaleString("ru-RU")} ₽`,
              "Сумма"
            ]}
          />
          <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="var(--accent)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
