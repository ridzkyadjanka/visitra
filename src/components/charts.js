'use client';

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts';

const BLUE = '#2F6BFF';
export const PALETTE = ['#2F6BFF', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4', '#64748B'];
const tip = { contentStyle: { borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }, cursor: { fill: '#EEF4FF' } };

export function HourlyBar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#EEF2F7" />
        <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} stroke="#94A3B8" />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="#94A3B8" />
        <Tooltip {...tip} formatter={(v) => [v, 'Kunjungan']} labelFormatter={(l) => `Pukul ${l}:00`} />
        <Bar dataKey="total" fill={BLUE} radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendArea({ data, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.25} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#EEF2F7" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#94A3B8" minTickGap={16} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="#94A3B8" />
        <Tooltip {...tip} formatter={(v) => [v, 'Kunjungan']} />
        <Area type="monotone" dataKey="total" stroke={BLUE} strokeWidth={2.5} fill="url(#g)" dot={{ r: 3, fill: BLUE }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, total, centerLabel = 'Tamu' }) {
  const sum = data.reduce((a, b) => a + b.value, 0) || 1;
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.length ? data : [{ name: '-', value: 1 }]} dataKey="value" innerRadius={56} outerRadius={80} paddingAngle={2} stroke="none">
              {(data.length ? data : [{}]).map((_, i) => <Cell key={i} fill={data.length ? PALETTE[i % PALETTE.length] : '#E2E8F0'} />)}
            </Pie>
            {data.length > 0 && <Tooltip contentStyle={tip.contentStyle} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-slate-500">{centerLabel}</p></div>
        </div>
      </div>
      <ul className="w-full space-y-2.5 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />{d.name}
            </span>
            <span className="font-semibold">{Math.round((d.value / sum) * 100)}%</span>
          </li>
        ))}
        {!data.length && <li className="text-slate-400">Belum ada data</li>}
      </ul>
    </div>
  );
}

export function HBar({ data, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="#EEF2F7" />
        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="#94A3B8" />
        <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} fontSize={12} stroke="#64748B" />
        <Tooltip {...tip} formatter={(v) => [v, 'Kunjungan']} />
        <Bar dataKey="value" fill={BLUE} radius={[0, 6, 6, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
