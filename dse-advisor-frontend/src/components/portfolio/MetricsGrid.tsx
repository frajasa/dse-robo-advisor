"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Wallet } from "lucide-react";

interface Metrics {
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  projectedAnnualDividend: number;
  holdingsCount: number;
}

interface MetricsGridProps {
  metrics: Metrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const cards = [
    {
      title: "Expected Return",
      value: `${(metrics.expectedReturn * 100).toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-green-400",
    },
    {
      title: "Volatility",
      value: `${(metrics.expectedVolatility * 100).toFixed(2)}%`,
      icon: TrendingDown,
      color: "text-red-400",
    },
    {
      title: "Sharpe Ratio",
      value: metrics.sharpeRatio.toFixed(3),
      icon: BarChart3,
      color: "text-amber-400",
    },
    {
      title: "Projected Dividend",
      value: `TZS ${metrics.projectedAnnualDividend.toLocaleString()}`,
      icon: Wallet,
      color: "text-blue-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
