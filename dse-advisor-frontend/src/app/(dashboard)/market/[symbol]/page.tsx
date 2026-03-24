"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { STOCK_DETAIL_QUERY } from "@/lib/graphql/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Loader2,
  BarChart3,
  DollarSign,
  Activity,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatTZS(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toLocaleString("en-TZ");
}

function formatMarketCap(value: number | null | undefined) {
  if (!value) return "—";
  if (value >= 1e12) return `TZS ${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `TZS ${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `TZS ${(value / 1e6).toFixed(1)}M`;
  return `TZS ${value.toLocaleString()}`;
}

function formatPct(value: number | null | undefined) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(2)}%`;
}

interface OrderBookEntry {
  buyPrice: number;
  buyQuantity: number;
  sellPrice: number;
  sellQuantity: number;
}

interface StockDetailData {
  symbol: string;
  companyName: string;
  sector: string | null;
  currentPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changePct: number | null;
  volume: number | null;
  high: number | null;
  low: number | null;
  bestBidPrice: number | null;
  bestAskPrice: number | null;
  marketCap: number | null;
  dividendYield: number | null;
  expectedReturn: number | null;
  volatility: number | null;
  dseCompanyId: number | null;
  orderBook: OrderBookEntry[] | null;
}

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params.symbol as string)?.toUpperCase();

  const { data, loading, error } = useQuery(STOCK_DETAIL_QUERY, {
    variables: { symbol },
    skip: !symbol,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stock: StockDetailData | null = (data as Record<string, any>)?.stockDetail || null;

  const isUp = stock?.change != null && stock.change > 0;
  const isDown = stock?.change != null && stock.change < 0;

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/market")}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Market
        </Button>
        {stock && (
          <div>
            <h1 className="text-2xl font-bold text-white">
              {stock.symbol}{" "}
              <span className="text-lg font-normal text-zinc-400">
                {stock.companyName}
              </span>
            </h1>
            {stock.sector && (
              <span className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                {stock.sector}
              </span>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      )}

      {error && (
        <Card className="border-red-500/20 bg-zinc-900">
          <CardContent className="py-8 text-center">
            <p className="text-red-400">Failed to load stock details.</p>
          </CardContent>
        </Card>
      )}

      {stock && (
        <>
          {/* Price hero */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="p-6">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-white">
                  TZS {formatTZS(stock.currentPrice)}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-lg font-semibold",
                    isUp ? "text-green-400" : isDown ? "text-red-400" : "text-zinc-500"
                  )}
                >
                  {isUp ? <TrendingUp className="h-5 w-5" /> : isDown ? <TrendingDown className="h-5 w-5" /> : null}
                  {isUp ? "+" : ""}
                  {stock.change ?? 0} ({isUp ? "+" : ""}
                  {stock.changePct?.toFixed(2) ?? "0.00"}%)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Summary stats grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="flex items-center gap-3 p-4">
                <DollarSign className="h-8 w-8 text-amber-400" />
                <div>
                  <p className="text-xs text-zinc-400">Previous Close</p>
                  <p className="text-lg font-bold text-white">
                    TZS {formatTZS(stock.previousClose)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="flex items-center gap-3 p-4">
                <Activity className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-xs text-zinc-400">Day Range</p>
                  <p className="text-lg font-bold text-white">
                    {formatTZS(stock.low)} — {formatTZS(stock.high)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="flex items-center gap-3 p-4">
                <BarChart3 className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-xs text-zinc-400">Volume</p>
                  <p className="text-lg font-bold text-white">
                    {stock.volume?.toLocaleString() ?? "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="flex items-center gap-3 p-4">
                <DollarSign className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-xs text-zinc-400">Market Cap</p>
                  <p className="text-lg font-bold text-white">
                    {formatMarketCap(stock.marketCap)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bid/Ask + fundamentals */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">Trading Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-sm text-zinc-400">Best Bid Price</span>
                    <span className="font-mono text-sm font-medium text-green-400">
                      TZS {formatTZS(stock.bestBidPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-sm text-zinc-400">Best Ask Price</span>
                    <span className="font-mono text-sm font-medium text-red-400">
                      TZS {formatTZS(stock.bestAskPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-sm text-zinc-400">Spread</span>
                    <span className="font-mono text-sm text-white">
                      {stock.bestBidPrice != null && stock.bestAskPrice != null
                        ? `TZS ${formatTZS(stock.bestAskPrice - stock.bestBidPrice)}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-sm text-zinc-400">Dividend Yield</span>
                    <span className="font-mono text-sm text-white">
                      {formatPct(stock.dividendYield)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-sm text-zinc-400">Expected Return</span>
                    <span className="font-mono text-sm text-white">
                      {formatPct(stock.expectedReturn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-400">Volatility</span>
                    <span className="font-mono text-sm text-white">
                      {formatPct(stock.volatility)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Book */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BookOpen className="h-5 w-5 text-amber-400" />
                  Order Book
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stock.orderBook && stock.orderBook.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="w-full text-sm">
                      <thead className="border-b border-zinc-800 bg-zinc-950/50">
                        <tr>
                          <th className="px-3 py-2 text-right font-medium text-green-400">
                            Buy Qty
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-green-400">
                            Buy Price
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-red-400">
                            Sell Price
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-red-400">
                            Sell Qty
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {stock.orderBook.map((entry, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/50">
                            <td className="px-3 py-1.5 text-right font-mono text-zinc-300">
                              {entry.buyQuantity.toLocaleString()}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-green-400/80">
                              {formatTZS(entry.buyPrice)}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-red-400/80">
                              {formatTZS(entry.sellPrice)}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-zinc-300">
                              {entry.sellQuantity.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-zinc-500">
                    <BookOpen className="mb-2 h-8 w-8" />
                    <p className="text-sm">No order book data available</p>
                    {!stock.dseCompanyId && (
                      <p className="mt-1 text-xs text-zinc-600">
                        DSE company ID not mapped for this stock
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
