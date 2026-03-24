"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface DividendData {
  month: string;
  projected: number;
}

interface DividendBarChartProps {
  data: DividendData[];
}

export function DividendBarChart({ data }: DividendBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No dividend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
        <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
        <Tooltip
          contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }}
          labelStyle={{ color: "#a1a1aa" }}
          formatter={(value) => [`TZS ${Number(value).toLocaleString()}`, "Projected Dividend"]}
        />
        <Bar dataKey="projected" fill="#34d399" radius={[4, 4, 0, 0]} name="Projected Dividend" />
      </BarChart>
    </ResponsiveContainer>
  );
}
