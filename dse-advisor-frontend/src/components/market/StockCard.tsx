"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockCardProps {
  symbol: string;
  companyName: string;
  sector: string;
  expectedReturn: number;
  volatility: number;
  dividendYield: number;
  currentPrice?: number;
  priceChange?: number;
  high?: number;
  low?: number;
  volume?: number;
  bestBidPrice?: number | null;
  bestAskPrice?: number | null;
  marketCap?: number | null;
}

function formatCap(value: number | null | undefined) {
  if (!value) return "—";
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  return `${(value / 1e6).toFixed(0)}M`;
}

export function StockCard({
  symbol,
  companyName,
  sector,
  expectedReturn,
  volatility,
  dividendYield,
  currentPrice,
  priceChange,
  high,
  low,
  volume,
  bestBidPrice,
  bestAskPrice,
  marketCap,
}: StockCardProps) {
  const isUp = priceChange !== undefined && priceChange >= 0;

  return (
    <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-amber-400/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-amber-400">{symbol}</CardTitle>
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
            {sector}
          </span>
        </div>
        <p className="text-sm text-zinc-400">{companyName}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {currentPrice !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Price</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-white">
                TZS {currentPrice.toLocaleString()}
              </span>
              {priceChange !== undefined && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    isUp ? "text-green-400" : "text-red-400"
                  )}
                >
                  {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isUp ? "+" : ""}{priceChange.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        )}
        {(high !== undefined || low !== undefined) && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Range</span>
            <span className="font-mono text-xs text-zinc-300">
              {low?.toLocaleString() ?? "—"} — {high?.toLocaleString() ?? "—"}
            </span>
          </div>
        )}
        {volume !== undefined && volume > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Volume</span>
            <span className="font-mono text-xs text-zinc-300">{volume.toLocaleString()}</span>
          </div>
        )}
        {(bestBidPrice || bestAskPrice) && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Bid / Ask</span>
            <span className="font-mono text-xs">
              <span className="text-green-400/70">{bestBidPrice?.toLocaleString() ?? "—"}</span>
              {" / "}
              <span className="text-red-400/70">{bestAskPrice?.toLocaleString() ?? "—"}</span>
            </span>
          </div>
        )}
        {marketCap && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Market Cap</span>
            <span className="text-xs text-zinc-300">TZS {formatCap(marketCap)}</span>
          </div>
        )}
        <div className="mt-1 border-t border-zinc-800 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Exp. Return</span>
            <span className="text-green-400">{(expectedReturn * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Volatility</span>
            <span className="text-red-400">{(volatility * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Div Yield</span>
            <span className="text-blue-400">{(dividendYield * 100).toFixed(2)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
