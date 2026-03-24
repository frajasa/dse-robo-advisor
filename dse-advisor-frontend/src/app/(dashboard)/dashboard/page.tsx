"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { MY_PORTFOLIOS_QUERY, PORTFOLIO_ANALYTICS_QUERY, MY_PROFILE_QUERY } from "@/lib/graphql/queries";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  TrendingUp,
  BarChart3,
  Hash,
  Plus,
  Loader2,
  Bell,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioMetrics {
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  projectedAnnualDividend: number;
  holdingsCount: number;
}

interface Portfolio {
  id: string;
  name: string;
  riskProfile: string;
  createdAt: string;
  metrics: PortfolioMetrics;
}

const riskColors: Record<string, string> = {
  CONSERVATIVE: "from-green-400/20 to-green-400/5 text-green-400 border-green-400/20",
  MODERATE: "from-amber-400/20 to-amber-400/5 text-amber-400 border-amber-400/20",
  AGGRESSIVE: "from-red-400/20 to-red-400/5 text-red-400 border-red-400/20",
};

export default function DashboardPage() {
  const { data, loading, error } = useQuery(MY_PORTFOLIOS_QUERY);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portfolios: Portfolio[] = (data as Record<string, any>)?.myPortfolios || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = useQuery(MY_PROFILE_QUERY);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = (profileData as Record<string, any>)?.myProfile;
  const capitalInvested = profile?.capitalAvailable || 0;

  const firstPortfolioId = portfolios.length > 0 ? portfolios[0].id : null;
  const { data: analyticsData } = useQuery(PORTFOLIO_ANALYTICS_QUERY, {
    variables: { portfolioId: firstPortfolioId },
    skip: !firstPortfolioId,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analytics = (analyticsData as Record<string, any>)?.portfolioAnalytics;

  const totalValue = analytics?.totalValue || capitalInvested;
  const profitLoss = totalValue - capitalInvested;
  const profitLossPct = capitalInvested > 0 ? (profitLoss / capitalInvested) * 100 : 0;
  const totalDividendIncome = portfolios.reduce(
    (s, p) => s + (p.metrics.projectedAnnualDividend || 0), 0
  );

  const totalReturn = portfolios.length
    ? portfolios.reduce((s, p) => s + p.metrics.expectedReturn, 0) / portfolios.length
    : 0;
  const totalHoldings = portfolios.reduce((s, p) => s + p.metrics.holdingsCount, 0);
  const avgSharpe = portfolios.length
    ? portfolios.reduce((s, p) => s + p.metrics.sharpeRatio, 0) / portfolios.length
    : 0;

  const formatTZS = (v: number) => {
    if (v >= 1e9) return `TZS ${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `TZS ${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `TZS ${(v / 1e3).toFixed(0)}K`;
    return `TZS ${v.toFixed(0)}`;
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Overview of your investment portfolios
          </p>
        </div>
        <Link href="/advisor">
          <Button className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-400/20 hover:from-amber-500 hover:to-amber-600 sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Portfolio
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center backdrop-blur-sm">
          <p className="text-red-400">Failed to load portfolios. Please try again.</p>
        </div>
      )}

      {/* Summary Stats with P&L */}
      {!loading && !error && portfolios.length > 0 && (
        <>
          {/* Primary P&L Banner */}
          <div className="glass-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-zinc-500">Total Portfolio Value</p>
                <p className="text-3xl font-bold text-white">{formatTZS(totalValue)}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-sm font-medium ${profitLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {profitLoss >= 0 ? "+" : ""}{formatTZS(profitLoss)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    profitLoss >= 0
                      ? "bg-green-400/10 text-green-400"
                      : "bg-red-400/10 text-red-400"
                  }`}>
                    {profitLoss >= 0 ? "+" : ""}{profitLossPct.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Capital Invested</p>
                  <p className="text-lg font-semibold text-white">{formatTZS(capitalInvested)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Annual Dividends</p>
                  <p className="text-lg font-semibold text-amber-400">{formatTZS(totalDividendIncome)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-400/5">
                  <Briefcase className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Portfolios</p>
                  <p className="text-xl font-bold text-white">{portfolios.length}</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400/20 to-green-400/5">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Avg Return</p>
                  <p className="text-xl font-bold text-green-400">{(totalReturn * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400/20 to-blue-400/5">
                  <Hash className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Total Holdings</p>
                  <p className="text-xl font-bold text-white">{totalHoldings}</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400/20 to-purple-400/5">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Avg Sharpe</p>
                  <p className="text-xl font-bold text-white">{avgSharpe.toFixed(3)}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && !error && portfolios.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900">
            <Briefcase className="h-8 w-8 text-zinc-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">No Portfolios Yet</h3>
          <p className="mb-6 max-w-md text-center text-sm text-zinc-400">
            Create your first AI-optimized portfolio tailored to your investment goals.
          </p>
          <Link href="/advisor">
            <Button className="bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-400/20">
              <Plus className="mr-2 h-4 w-4" />
              Create Portfolio
            </Button>
          </Link>
        </div>
      )}

      {/* Portfolio Cards */}
      {!loading && !error && portfolios.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {portfolios.map((portfolio) => {
            const riskClass = riskColors[portfolio.riskProfile] || riskColors.MODERATE;
            return (
              <Link key={portfolio.id} href={`/portfolio/${portfolio.id}`}>
                <div className="glass-card group cursor-pointer p-5 transition-all duration-200 hover:border-amber-400/20 hover:shadow-lg hover:shadow-amber-400/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors">
                        {portfolio.name}
                      </h3>
                      <span className={cn("mt-1 inline-flex rounded-full border bg-gradient-to-r px-2.5 py-0.5 text-xs font-medium", riskClass)}>
                        {portfolio.riskProfile}
                      </span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-amber-400" />
                  </div>
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Expected Return</span>
                      <span className="font-mono font-medium text-green-400">
                        {(portfolio.metrics.expectedReturn * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Sharpe Ratio</span>
                      <span className="font-mono font-medium text-amber-400">
                        {portfolio.metrics.sharpeRatio.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Holdings</span>
                      <span className="font-mono font-medium text-blue-400">
                        {portfolio.metrics.holdingsCount}
                      </span>
                    </div>
                  </div>
                  {portfolio.createdAt && (
                    <p className="mt-3 text-xs text-zinc-600">
                      {new Date(portfolio.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Alerts */}
      {!loading && !error && portfolios.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="border-b border-white/5 px-5 py-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-white">
              <Bell className="h-4 w-4 text-amber-400" />
              Alerts & Notifications
            </h3>
          </div>
          <div className="p-5">
            {portfolios.some(
              (p) => p.metrics.expectedVolatility > 0.15 || p.metrics.sharpeRatio < 0.3
            ) ? (
              <div className="space-y-3">
                {portfolios
                  .filter((p) => p.metrics.expectedVolatility > 0.15)
                  .map((p) => (
                    <div key={`vol-${p.id}`} className="flex items-start gap-3 rounded-xl border border-amber-400/10 bg-amber-400/5 p-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-white">High volatility: {p.name}</p>
                        <p className="text-xs text-zinc-400">
                          Volatility of {(p.metrics.expectedVolatility * 100).toFixed(1)}% exceeds 15% threshold.
                        </p>
                      </div>
                    </div>
                  ))}
                {portfolios
                  .filter((p) => p.metrics.sharpeRatio < 0.3 && p.metrics.expectedVolatility <= 0.15)
                  .map((p) => (
                    <div key={`sr-${p.id}`} className="flex items-start gap-3 rounded-xl border border-blue-400/10 bg-blue-400/5 p-3">
                      <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Low Sharpe: {p.name}</p>
                        <p className="text-xs text-zinc-400">
                          Sharpe ratio of {p.metrics.sharpeRatio.toFixed(3)} is below 0.3.
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
                <p className="text-sm text-zinc-400">All portfolios are healthy. No action needed.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
