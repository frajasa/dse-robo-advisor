"use client";

import React, { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { MY_PORTFOLIOS_QUERY, PORTFOLIO_ANALYTICS_QUERY } from "@/lib/graphql/queries";
import { SubscriptionGate } from "@/components/shared/SubscriptionGate";
import { PerformanceChart } from "@/components/analytics/PerformanceChart";
import { SectorPieChart } from "@/components/analytics/SectorPieChart";
import { DividendBarChart } from "@/components/analytics/DividendBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, PieChart, BarChart3, Loader2 } from "lucide-react";

interface Portfolio {
  id: string;
  name: string;
}

export default function AnalyticsPage() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");

  const { data: portfoliosData } = useQuery(MY_PORTFOLIOS_QUERY);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portfolios: Portfolio[] = (portfoliosData as Record<string, any>)?.myPortfolios || [];

  const { data: analyticsData, loading: analyticsLoading } = useQuery(
    PORTFOLIO_ANALYTICS_QUERY,
    {
      variables: { portfolioId: selectedPortfolioId },
      skip: !selectedPortfolioId,
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analytics = (analyticsData as Record<string, any>)?.portfolioAnalytics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-zinc-400">
            Advanced portfolio analytics and insights
          </p>
        </div>
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

      <SubscriptionGate requiredTier="PREMIUM" featureName="Advanced Analytics">
        {!selectedPortfolioId ? (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="flex flex-col items-center py-12">
              <BarChart3 className="mb-4 h-10 w-10 text-zinc-600" />
              <p className="text-sm text-zinc-400">
                Select a portfolio above to view analytics
              </p>
            </CardContent>
          </Card>
        ) : analyticsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Performance Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceChart data={analytics?.performanceHistory || []} />
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <PieChart className="h-5 w-5 text-amber-400" />
                    Sector Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SectorPieChart data={analytics?.sectorAllocation || []} />
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    Dividend Projections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DividendBarChart data={analytics?.dividendProjections || []} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </SubscriptionGate>
    </div>
  );
}
