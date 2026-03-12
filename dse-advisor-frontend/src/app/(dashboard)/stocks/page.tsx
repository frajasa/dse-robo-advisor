"use client";

import React from "react";
import { useQuery } from "@apollo/client/react";
import { STOCKS_QUERY } from "@/lib/graphql/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Stock {
  id: string;
  symbol: string;
  companyName: string;
  sector: string;
  expectedReturn: number;
  volatility: number;
  dividendYield: number;
}

export default function StocksPage() {
  const { data, loading, error } = useQuery(STOCKS_QUERY);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stocks: Stock[] = (data as Record<string, any>)?.stocks || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">DSE Stocks</h1>
        <p className="text-sm text-zinc-400">
          All listed stocks on the Dar es Salaam Stock Exchange
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">
            Failed to load stocks. Please try again.
          </p>
        </div>
      )}

      {!loading && !error && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">
              Listed Securities ({stocks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-950/50">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-zinc-400">
                      Symbol
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-zinc-400">
                      Company
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-zinc-400">
                      Sector
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-400">
                      Expected Return
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-400">
                      Volatility
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-400">
                      Dividend Yield
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {stocks.map((stock) => (
                    <tr
                      key={stock.id}
                      className="transition-colors hover:bg-zinc-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-amber-400">
                        {stock.symbol}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-200">
                        {stock.companyName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                          {stock.sector}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-green-400">
                        {(stock.expectedReturn * 100).toFixed(2)}%
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-red-400">
                        {(stock.volatility * 100).toFixed(2)}%
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-blue-400">
                        {(stock.dividendYield * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
