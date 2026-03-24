"use client";

import React from "react";
import { useMarketFeed } from "@/hooks/useMarketFeed";
import { cn } from "@/lib/utils";

const WATCHLIST = [
  "NMB", "CRDB", "TBL", "VODA", "TCC", "TPCC", "NICO",
  "SWIS", "DSE", "KCB", "MCB", "DCB", "EABL", "MKCB",
];

function TickerItem({ symbol, prices }: { symbol: string; prices: Record<string, { currentPrice: number; changePct: number }> }) {
  const tick = prices[symbol];
  const up = tick && tick.changePct >= 0;
  return (
    <div className="flex shrink-0 items-center gap-2 px-3">
      <span className="font-mono text-xs font-bold text-zinc-200">
        {symbol}
      </span>
      <span className="font-mono text-xs text-zinc-400">
        {tick ? `TZS ${tick.currentPrice.toLocaleString()}` : "\u2014"}
      </span>
      {tick && (
        <span
          className={cn(
            "rounded border px-1.5 py-0 font-mono text-xs",
            up
              ? "border-green-500/40 text-green-400"
              : "border-red-500/40 text-red-400"
          )}
        >
          {up ? "+" : ""}
          {tick.changePct.toFixed(2)}%
        </span>
      )}
    </div>
  );
}

export function MarketTicker() {
  const { prices, connected } = useMarketFeed(WATCHLIST);

  return (
    <div className="relative overflow-hidden border-b border-zinc-800 bg-zinc-950">
      <div className="flex items-center">
        {/* Fixed DSE LIVE badge */}
        <div className="z-10 flex shrink-0 items-center gap-2 border-r border-zinc-800 bg-zinc-950 px-4 py-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              connected ? "animate-pulse bg-green-400" : "bg-red-400"
            )}
          />
          <span className="font-mono text-xs font-semibold text-zinc-500">DSE LIVE</span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex min-w-0 flex-1 overflow-hidden py-2">
          <div className="ticker-scroll flex">
            {/* First copy */}
            {WATCHLIST.map((symbol) => (
              <TickerItem key={`a-${symbol}`} symbol={symbol} prices={prices} />
            ))}
            {/* Duplicate for seamless loop */}
            {WATCHLIST.map((symbol) => (
              <TickerItem key={`b-${symbol}`} symbol={symbol} prices={prices} />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .ticker-scroll {
          animation: scroll-left 40s linear infinite;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
