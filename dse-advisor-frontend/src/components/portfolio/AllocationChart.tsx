"use client";

import React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface Holding {
  symbol: string;
  name: string;
  allocationPct: number;
  dividendYield: number;
  sector: string;
  rationale?: string;
}

interface AllocationChartProps {
  holdings: Holding[];
}

const SECTOR_COLORS: Record<string, string> = {
  Banking: "#f59e0b",
  Finance: "#f59e0b",
  "Financial Services": "#f59e0b",
  Brewery: "#10b981",
  Manufacturing: "#3b82f6",
  Industrial: "#3b82f6",
  Telecommunications: "#8b5cf6",
  Agriculture: "#22c55e",
  Cement: "#6b7280",
  "Building Materials": "#6b7280",
  Insurance: "#ec4899",
  Energy: "#ef4444",
  "Consumer Goods": "#14b8a6",
  Retail: "#f97316",
  Default: "#a855f7",
};

const FALLBACK_COLORS = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#22c55e",
  "#ec4899",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#a855f7",
  "#06b6d4",
  "#84cc16",
];

function getColor(sector: string, index: number): string {
  return SECTOR_COLORS[sector] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export function AllocationChart({ holdings }: AllocationChartProps) {
  const data = holdings.map((h, index) => ({
    name: h.symbol,
    value: h.allocationPct,
    sector: h.sector,
    color: getColor(h.sector, index),
  }));

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={140}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
            labelLine={true}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#fafafa",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [
              `${Number(value).toFixed(1)}%`,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-sm text-zinc-300">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
