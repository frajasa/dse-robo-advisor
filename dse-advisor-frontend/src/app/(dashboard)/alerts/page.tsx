"use client";

import React, { useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  MY_PORTFOLIOS_QUERY,
  PORTFOLIO_REBALANCING_QUERY,
} from "@/lib/graphql/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface RebalancingAlert {
  symbol: string;
  name: string;
  action: string;
  currentAllocation: number;
  targetAllocation: number;
  drift: number;
  severity: string;
}

interface RebalancingResult {
  needsRebalancing: boolean;
  alerts: RebalancingAlert[];
  portfolioId: string;
}

interface Portfolio {
  id: string;
  name: string;
}

export default function AlertsPage() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");

  const { data: portfoliosData } = useQuery(MY_PORTFOLIOS_QUERY);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portfolios: Portfolio[] = (portfoliosData as Record<string, any>)?.myPortfolios || [];

  const { data: rebalData, loading: rebalLoading, refetch } = useQuery(
    PORTFOLIO_REBALANCING_QUERY,
    {
      variables: { portfolioId: selectedPortfolioId },
      skip: !selectedPortfolioId,
      fetchPolicy: "network-only",
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rebalResult: RebalancingResult | null = (rebalData as Record<string, any>)?.portfolioRebalancing || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts & Rebalancing</h1>
          <p className="text-sm text-zinc-400">
            Monitor portfolio drift and manage price alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedPortfolioId && (
            <button
              onClick={() => refetch()}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          {portfolios.length > 0 && (
            <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
              <SelectTrigger className="w-64 border-zinc-700 bg-zinc-800 text-white">
                <SelectValue placeholder="Select a portfolio" />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-800">
                {portfolios.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="text-zinc-200 focus:bg-zinc-700 focus:text-white"
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Rebalancing Section */}
      {!selectedPortfolioId ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="flex flex-col items-center py-12">
            <Bell className="mb-4 h-10 w-10 text-zinc-600" />
            <p className="text-sm text-zinc-400">
              Select a portfolio above to check for rebalancing alerts
            </p>
          </CardContent>
        </Card>
      ) : rebalLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      ) : rebalResult ? (
        <div className="space-y-6">
          {/* Status Banner */}
          <Card
            className={`border ${
              rebalResult.needsRebalancing
                ? "border-amber-400/30 bg-amber-400/5"
                : "border-green-400/30 bg-green-400/5"
            }`}
          >
            <CardContent className="flex items-center gap-4 py-4">
              {rebalResult.needsRebalancing ? (
                <>
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                  <div>
                    <p className="font-medium text-amber-400">Rebalancing Recommended</p>
                    <p className="text-sm text-zinc-400">
                      {rebalResult.alerts.length} holding{rebalResult.alerts.length !== 1 ? "s" : ""} have
                      drifted beyond the 5% threshold
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="font-medium text-green-400">Portfolio Balanced</p>
                    <p className="text-sm text-zinc-400">
                      All holdings are within the acceptable drift range
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Alerts List */}
          {rebalResult.alerts.length > 0 && (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <RefreshCw className="h-5 w-5 text-amber-400" />
                  Rebalancing Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rebalResult.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <div className="flex items-center gap-3">
                        {alert.action === "BUY" ? (
                          <ArrowUpCircle className="h-8 w-8 text-green-400" />
                        ) : (
                          <ArrowDownCircle className="h-8 w-8 text-red-400" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{alert.symbol}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                                alert.severity === "HIGH"
                                  ? "bg-red-400/10 text-red-400"
                                  : "bg-amber-400/10 text-amber-400"
                              }`}
                            >
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400">{alert.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-zinc-500">
                            {alert.currentAllocation.toFixed(1)}%
                          </span>
                          <span className="text-zinc-600">&rarr;</span>
                          <span className="text-white">
                            {alert.targetAllocation.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          {alert.action === "BUY" ? (
                            <TrendingUp className="h-3 w-3 text-green-400" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-400" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              alert.action === "BUY" ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {alert.action} &middot; {alert.drift.toFixed(1)}% drift
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education Tip */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="py-4">
              <p className="text-sm text-zinc-400">
                <span className="font-medium text-amber-400">Why rebalance?</span>{" "}
                Over time, some stocks in your portfolio grow faster than others, shifting
                your actual allocation away from the target. Rebalancing brings it back
                in line with your risk profile — selling winners that are overweight and
                buying underweight positions to maintain your intended diversification.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
