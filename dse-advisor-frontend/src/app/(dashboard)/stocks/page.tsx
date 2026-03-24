"use client";

import React, { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { STOCKS_QUERY } from "@/lib/graphql/queries";
import { useMarketFeed } from "@/hooks/useMarketFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stock {
  id: string;
  symbol: string;
  companyName: string;
  sector: string;
  expectedReturn: number;
  volatility: number;
  dividendYield: number;
  marketCap: number | null;
}

const ALL_SYMBOLS = [
  "NMB", "CRDB", "TBL", "VODA", "SWIS", "NICO", "TCC", "TPCC",
  "TCCL", "DCB", "MCB", "MKCB", "MBP", "KCB", "DSE", "TOL",
  "TTP", "PAL", "EABL", "JHL", "AFRIPRISE", "MUCOBA",
  "IEACLC-ETF", "VERTEX-ETF", "NMG", "SWALA", "YETU", "KA", "JATU", "USL",
];

function formatMarketCap(value: number | null | undefined) {
  if (!value) return "—";
  if (value >= 1e12) return `TZS ${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `TZS ${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `TZS ${(value / 1e6).toFixed(1)}M`;
  return `TZS ${value.toLocaleString()}`;
}

export default function StocksPage() {
  const { data, loading, error } = useQuery(STOCKS_QUERY);
  const { prices } = useMarketFeed(ALL_SYMBOLS);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stocks: Stock[] = (data as Record<string, any>)?.stocks || [];

  const sectors = Array.from(new Set(stocks.map((s) => s.sector).filter(Boolean))).sort();

  const filtered = stocks
    .filter((s) => {
      const matchesSearch =
        !search ||
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.companyName.toLowerCase().includes(search.toLowerCase());
      const matchesSector = sectorFilter === "all" || s.sector === sectorFilter;
      return matchesSearch && matchesSector;
    })
    .sort((a, b) => {
      const aHasData = prices[a.symbol] ? 1 : 0;
      const bHasData = prices[b.symbol] ? 1 : 0;
      return bHasData - aHasData;
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">DSE Securities</h1>
        <p className="text-sm text-zinc-400">
          All listed stocks on the Dar es Salaam Stock Exchange with live market data
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">Failed to load stocks.</p>
        </div>
      )}

      {!loading && !error && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-white">
                Listed Securities ({filtered.length})
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-md border border-zinc-700 bg-zinc-800 py-2 pl-8 pr-3 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="all">All Sectors</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-950/50">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-3 font-medium text-zinc-400">Symbol</th>
                    <th className="whitespace-nowrap px-3 py-3 font-medium text-zinc-400">Company</th>
                    <th className="whitespace-nowrap px-3 py-3 font-medium text-zinc-400">Sector</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Price (TZS)</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Change</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Volume</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Market Cap</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Div Yield</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Exp. Return</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Volatility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filtered.map((stock) => {
                    const tick = prices[stock.symbol];
                    const up = tick && tick.change > 0;
                    const down = tick && tick.change < 0;
                    return (
                      <tr key={stock.id} className="transition-colors hover:bg-zinc-800/50">
                        <td className="whitespace-nowrap px-3 py-2.5 font-medium text-amber-400">
                          {stock.symbol}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-zinc-200 max-w-[200px] truncate">
                          {stock.companyName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                            {stock.sector}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-medium text-white">
                          {tick ? tick.currentPrice.toLocaleString() : "—"}
                        </td>
                        <td className={cn(
                          "whitespace-nowrap px-3 py-2.5 text-right font-mono text-xs",
                          up ? "text-green-400" : down ? "text-red-400" : "text-zinc-500"
                        )}>
                          {tick ? (
                            <span className="inline-flex items-center gap-1">
                              {up ? <TrendingUp className="h-3 w-3" /> : down ? <TrendingDown className="h-3 w-3" /> : null}
                              {up ? "+" : ""}{tick.changePct.toFixed(2)}%
                            </span>
                          ) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-zinc-400">
                          {tick?.volume ? tick.volume.toLocaleString() : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-zinc-400">
                          {formatMarketCap(tick?.marketCap || stock.marketCap)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right text-blue-400">
                          {(stock.dividendYield * 100).toFixed(2)}%
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right text-green-400">
                          {(stock.expectedReturn * 100).toFixed(1)}%
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right text-red-400">
                          {(stock.volatility * 100).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
