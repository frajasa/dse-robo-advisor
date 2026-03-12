"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { PORTFOLIO_QUERY } from "@/lib/graphql/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AllocationChart } from "@/components/portfolio/AllocationChart";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { MetricsGrid } from "@/components/portfolio/MetricsGrid";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PortfolioDetailPage() {
  const params = useParams();
  const portfolioId = params.id as string;

  const { data, loading, error } = useQuery(PORTFOLIO_QUERY, {
    variables: { id: portfolioId },
    skip: !portfolioId,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portfolio = (data as Record<string, any>)?.portfolio;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">
            Failed to load portfolio. Please try again.
          </p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
          <p className="text-zinc-400">Portfolio not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {portfolio.name}
            </h1>
            <p className="text-sm text-zinc-400">
              Risk Profile:{" "}
              <span className="text-amber-400">
                {portfolio.riskProfile}
              </span>
            </p>
          </div>
        </div>
      </div>

      <MetricsGrid metrics={portfolio.metrics} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationChart holdings={portfolio.holdings} />
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <HoldingsTable holdings={portfolio.holdings} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
