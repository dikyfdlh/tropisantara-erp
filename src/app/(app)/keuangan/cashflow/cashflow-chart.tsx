'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Line, ComposedChart,
} from 'recharts';

type Row = {
  monthLabel: string;
  inflow: number;
  outflow: number;
  net: number;
};

function fmtRp(n: number) {
  if (Math.abs(n) >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (Math.abs(n) >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n}`;
}

export function CashflowChart({ data }: { data: Row[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtRp} />
          <Tooltip
            formatter={(v: number) => fmtRp(v)}
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="inflow"  name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="outflow" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="net" name="Net Cashflow" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
