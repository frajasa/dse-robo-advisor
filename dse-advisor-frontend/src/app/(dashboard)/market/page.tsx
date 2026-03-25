"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { STOCKS_QUERY } from "@/lib/graphql/queries";
import { MarketTicker } from "@/components/market/MarketTicker";
import { useMarketFeed } from "@/hooks/useMarketFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Loader2, BarChart3, DollarSign, Activity, RefreshCw } from "lucide-react";
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

function formatTZS(value: number) {
  return value.toLocaleString("en-TZ");
}

function formatMarketCap(value: number | null | undefined) {
  if (!value) return "—";
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return value.toLocaleString();
}

export default function MarketPage() {
  const router = useRouter();
  const { data, loading, error } = useQuery(STOCKS_QUERY);
  const { prices, connected, lastUpdated } = useMarketFeed(ALL_SYMBOLS);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allStocks: Stock[] = (data as Record<string, any>)?.stocks || [];
  // Filter out stocks without price data (live ticks or market cap from DB)
  const hasTicks = Object.keys(prices).length > 0;
  const stocks = hasTicks
    ? allStocks.filter((s) => prices[s.symbol])
    : allStocks.filter((s) => s.marketCap && s.marketCap > 0);

  // Compute market summary from live ticks
  const ticks = Object.values(prices);
  const gainers = ticks.filter((t) => t.change > 0).length;
  const losers = ticks.filter((t) => t.change < 0).length;
  const unchanged = ticks.length - gainers - losers;
  const totalVolume = ticks.reduce((sum, t) => sum + (t.volume || 0), 0);
  const totalMarketCap = ticks.reduce((sum, t) => sum + (t.marketCap || 0), 0);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">Market Overview</h1>
          <p className="text-xs text-zinc-400 sm:text-sm">
            Live DSE market data from the official Dar es Salaam Stock Exchange
          </p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400">
            <RefreshCw className={cn("h-3 w-3", connected ? "animate-spin text-green-400" : "text-red-400")} style={{ animationDuration: "3s" }} />
            <span>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      <MarketTicker />

      {/* Market Summary Cards */}
      {ticks.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card className="glass-card rounded-xl border-0 group hover:ring-1 hover:ring-amber-400/20 transition-all duration-300">
            <CardContent className="flex items-center gap-3 p-3 sm:p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 group-hover:bg-amber-400/20 transition-colors">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-zinc-400">Securities</p>
                <p className="text-lg font-bold text-white sm:text-xl">{ticks.length}</p>
                <p className="text-[10px] sm:text-xs truncate">
                  <span className="text-green-400">{gainers} up</span>
                  {" / "}
                  <span className="text-red-400">{losers} dn</span>
                  {" / "}
                  <span className="text-zinc-400">{unchanged} flat</span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-xl border-0 group hover:ring-1 hover:ring-blue-400/20 transition-all duration-300">
            <CardContent className="flex items-center gap-3 p-3 sm:p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-400 group-hover:bg-blue-400/20 transition-colors">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-zinc-400">Total Volume</p>
                <p className="text-lg font-bold text-white sm:text-xl">{totalVolume.toLocaleString()}</p>
                <p className="text-[10px] sm:text-xs text-zinc-500">shares traded</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-xl border-0 group hover:ring-1 hover:ring-green-400/20 transition-all duration-300">
            <CardContent className="flex items-center gap-3 p-3 sm:p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-400/10 text-green-400 group-hover:bg-green-400/20 transition-colors">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-zinc-400">Market Cap</p>
                <p className="text-lg font-bold text-white sm:text-xl">TZS {formatMarketCap(totalMarketCap)}</p>
                <p className="text-[10px] sm:text-xs text-zinc-500">all equities</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-xl border-0 group hover:ring-1 hover:ring-emerald-400/20 transition-all duration-300">
            <CardContent className="flex items-center gap-3 p-3 sm:p-4">
              <div className={cn("h-3 w-3 shrink-0 rounded-full", connected ? "animate-pulse bg-green-400" : "bg-red-400")} />
              <div className="min-w-0">
                <p className="text-xs text-zinc-400">Connection</p>
                <p className="text-lg font-bold text-white sm:text-xl">{connected ? "Live" : "Offline"}</p>
                <p className="text-[10px] sm:text-xs text-zinc-500">{connected ? "Auto-refresh every 30s" : "Reconnecting..."}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      )}

      {error && (
        <div className="glass-card rounded-xl border-red-500/20 p-6 text-center">
          <p className="text-red-400">Failed to load market data.</p>
        </div>
      )}

      {/* Market Data Table */}
      {!loading && !error && (
        <Card className="glass-card rounded-xl border-0">
          <CardHeader>
            <CardTitle className="text-sm text-white sm:text-base">Live Market Data</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="overflow-x-auto rounded-lg border border-white/5 -mx-0 sm:mx-0" style={{ WebkitOverflowScrolling: "touch" }}>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/5 bg-zinc-950/50">
                  <tr>
                    <th className="sticky left-0 bg-zinc-950/90 whitespace-nowrap px-3 py-3 font-medium text-zinc-400">Symbol</th>
                    <th className="whitespace-nowrap px-3 py-3 font-medium text-zinc-400">Company</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Price</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Change</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Open</th>
                    <th className="hidden md:table-cell whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">High</th>
                    <th className="hidden md:table-cell whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Low</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Volume</th>
                    <th className="hidden lg:table-cell whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Bid</th>
                    <th className="hidden lg:table-cell whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Ask</th>
                    <th className="hidden lg:table-cell whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-400">Market Cap</th>
                    <th className="hidden md:table-cell whitespace-nowrap px-3 py-3 font-medium text-zinc-400">Sector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stocks.map((stock) => {
                    const tick = prices[stock.symbol];
                    const up = tick && tick.change > 0;
                    const down = tick && tick.change < 0;
                    return (
                      <tr key={stock.id} className="group/row cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-amber-400/5 hover:to-transparent" onClick={() => router.push(`/market/${stock.symbol}`)}>
                        <td className="sticky left-0 bg-zinc-900/90 backdrop-blur-sm whitespace-nowrap px-3 py-2.5 font-medium text-amber-400">
                          {stock.symbol}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-zinc-300 max-w-[180px] truncate">
                          {stock.companyName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-medium text-white">
                          {tick ? formatTZS(tick.currentPrice) : "—"}
                        </td>
                        <td className={cn(
                          "whitespace-nowrap px-3 py-2.5 text-right font-mono text-xs",
                          up ? "text-green-400" : down ? "text-red-400" : "text-zinc-500"
                        )}>
                          {tick ? (
                            <span className="flex items-center justify-end gap-1">
                              {up ? <TrendingUp className="h-3 w-3" /> : down ? <TrendingDown className="h-3 w-3" /> : null}
                              {up ? "+" : ""}{tick.changePct.toFixed(2)}%
                            </span>
                          ) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-zinc-400">
                          {tick ? formatTZS(tick.previousClose) : "—"}
                        </td>
                        <td className="hidden md:table-cell whitespace-nowrap px-3 py-2.5 text-right font-mono text-zinc-400">
                          {tick?.high ? formatTZS(tick.high) : "—"}
                        </td>
                        <td className="hidden md:table-cell whitespace-nowrap px-3 py-2.5 text-right font-mono text-zinc-400">
                          {tick?.low ? formatTZS(tick.low) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-zinc-400">
                          {tick?.volume ? tick.volume.toLocaleString() : "—"}
                        </td>
                        <td className="hidden lg:table-cell whitespace-nowrap px-3 py-2.5 text-right font-mono text-green-400/70">
                          {tick?.bestBidPrice ? formatTZS(tick.bestBidPrice) : "—"}
                        </td>
                        <td className="hidden lg:table-cell whitespace-nowrap px-3 py-2.5 text-right font-mono text-red-400/70">
                          {tick?.bestAskPrice ? formatTZS(tick.bestAskPrice) : "—"}
                        </td>
                        <td className="hidden lg:table-cell whitespace-nowrap px-3 py-2.5 text-right font-mono text-zinc-400">
                          {tick?.marketCap ? formatMarketCap(tick.marketCap) : "—"}
                        </td>
                        <td className="hidden md:table-cell whitespace-nowrap px-3 py-2.5">
                          <span className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                            {stock.sector}
                          </span>
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
