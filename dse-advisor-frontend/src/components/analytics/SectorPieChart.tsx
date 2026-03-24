"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface SectorData {
  sector: string;
  allocation: number;
}

interface SectorPieChartProps {
  data: SectorData[];
}

const COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#f87171", "#a78bfa", "#fb923c", "#2dd4bf", "#e879f9"];

export function SectorPieChart({ data }: SectorPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No sector data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="allocation"
          nameKey="sector"
          paddingAngle={2}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }}
          labelStyle={{ color: "#a1a1aa" }}
          formatter={(value) => [`${Number(value).toFixed(1)}%`, "Allocation"]}
        />
        <Legend
          formatter={(value) => <span style={{ color: "#d4d4d8" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
