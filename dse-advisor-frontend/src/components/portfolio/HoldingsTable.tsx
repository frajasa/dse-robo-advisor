"use client";

import React from "react";

interface Holding {
  id?: string;
  symbol: string;
  name: string;
  allocationPct: number;
  dividendYield: number;
  sector: string;
  rationale?: string;
}

interface HoldingsTableProps {
  holdings: Holding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/50">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-zinc-400">
              Symbol
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-zinc-400">
              Name
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-400">
              Allocation %
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-400">
              Dividend Yield
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-zinc-400">
              Sector
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-zinc-400">
              Rationale
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {holdings.map((holding, index) => (
            <tr
              key={holding.id || `${holding.symbol}-${index}`}
              className="transition-colors hover:bg-zinc-800/50"
            >
              <td className="whitespace-nowrap px-4 py-3 font-medium text-amber-400">
                {holding.symbol}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-zinc-200">
                {holding.name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-200">
                {holding.allocationPct.toFixed(1)}%
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-200">
                {(holding.dividendYield * 100).toFixed(2)}%
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                  {holding.sector}
                </span>
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-zinc-400">
                {holding.rationale || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
