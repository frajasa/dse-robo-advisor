"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { MY_PORTFOLIOS_QUERY } from "@/lib/graphql/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, TrendingUp, BarChart3, Hash, Plus, Loader2 } from "lucide-react";

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

export default function DashboardPage() {
  const { data, loading, error } = useQuery(MY_PORTFOLIOS_QUERY);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portfolios: Portfolio[] = (data as Record<string, any>)?.myPortfolios || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-400">
            Overview of your investment portfolios
          </p>
        </div>
        <Link href="/advisor">
          <Button className="bg-amber-400 text-black hover:bg-amber-500">
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
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">
            Failed to load portfolios. Please try again.
          </p>
        </div>
      )}

      {!loading && !error && portfolios.length === 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="mb-4 h-12 w-12 text-zinc-600" />
            <h3 className="mb-2 text-lg font-semibold text-white">
              No Portfolios Yet
            </h3>
            <p className="mb-6 max-w-md text-center text-sm text-zinc-400">
              Create your first AI-optimized portfolio tailored to your
              investment goals and risk tolerance.
            </p>
            <Link href="/advisor">
              <Button className="bg-amber-400 text-black hover:bg-amber-500">
                <Plus className="mr-2 h-4 w-4" />
                Create Portfolio
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && !error && portfolios.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <Link key={portfolio.id} href={`/portfolio/${portfolio.id}`}>
              <Card className="cursor-pointer border-zinc-800 bg-zinc-900 transition-colors hover:border-amber-400/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">
                      {portfolio.name}
                    </CardTitle>
                    <span className="inline-flex rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                      {portfolio.riskProfile}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      Expected Return
                    </div>
                    <span className="font-medium text-green-400">
                      {(portfolio.metrics.expectedReturn * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <BarChart3 className="h-4 w-4 text-amber-400" />
                      Sharpe Ratio
                    </div>
                    <span className="font-medium text-amber-400">
                      {portfolio.metrics.sharpeRatio.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Hash className="h-4 w-4 text-blue-400" />
                      Holdings
                    </div>
                    <span className="font-medium text-blue-400">
                      {portfolio.metrics.holdingsCount}
                    </span>
                  </div>
                  {portfolio.createdAt && (
                    <p className="pt-2 text-xs text-zinc-500">
                      Created{" "}
                      {new Date(portfolio.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
