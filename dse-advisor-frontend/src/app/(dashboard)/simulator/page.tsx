"use client";

import React, { useState } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { SIMULATE_INVESTMENT_QUERY } from "@/lib/graphql/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Calculator,
  TrendingUp,
  Banknote,
  Target,
  Loader2,
  ArrowUpRight,
  Wallet,
  PiggyBank,
  BarChart3,
} from "lucide-react";

function formatTZS(value: number): string {
  if (value >= 1_000_000_000) return `TZS ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `TZS ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `TZS ${(value / 1_000).toFixed(0)}K`;
  return `TZS ${value.toFixed(0)}`;
}

interface ProjectionPoint {
  year: number;
  optimistic: number;
  expected: number;
  pessimistic: number;
}

interface SimResult {
  projections: ProjectionPoint[];
  finalOptimistic: number;
  finalExpected: number;
  finalPessimistic: number;
  totalInvested: number;
  expectedProfit: number;
  expectedReturnPct: number;
  expectedAnnualReturn: number;
  expectedDividendIncome: number;
  riskTolerance: string;
}

const presets = [
  { label: "Starter", initial: 500_000, monthly: 100_000, years: 5, risk: "CONSERVATIVE" },
  { label: "Steady Growth", initial: 2_000_000, monthly: 300_000, years: 10, risk: "MODERATE" },
  { label: "Aggressive Saver", initial: 5_000_000, monthly: 500_000, years: 10, risk: "AGGRESSIVE" },
  { label: "Retirement Plan", initial: 10_000_000, monthly: 1_000_000, years: 20, risk: "MODERATE" },
];

export default function SimulatorPage() {
  const [initialInvestment, setInitialInvestment] = useState(2_000_000);
  const [monthlyContribution, setMonthlyContribution] = useState(300_000);
  const [horizonYears, setHorizonYears] = useState(10);
  const [riskTolerance, setRiskTolerance] = useState("MODERATE");

  const [simulate, { data, loading }] = useLazyQuery(SIMULATE_INVESTMENT_QUERY, {
    fetchPolicy: "network-only",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: SimResult | null = (data as Record<string, any>)?.simulateInvestment || null;

  const handleSimulate = () => {
    simulate({
      variables: {
        input: {
          initialInvestment,
          monthlyContribution,
          horizonYears,
          riskTolerance,
        },
      },
    });
  };

  const applyPreset = (preset: (typeof presets)[number]) => {
    setInitialInvestment(preset.initial);
    setMonthlyContribution(preset.monthly);
    setHorizonYears(preset.years);
    setRiskTolerance(preset.risk);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Investment Simulator</h1>
        <p className="text-sm text-zinc-400">
          See how your investments could grow over time with different strategies
        </p>
      </div>

      {/* Preset Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => applyPreset(preset)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-left transition-all hover:border-amber-400/30 hover:bg-zinc-800/80"
          >
            <p className="text-sm font-medium text-white">{preset.label}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {formatTZS(preset.initial)} + {formatTZS(preset.monthly)}/mo &middot; {preset.years}yr
            </p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <Card className="border-zinc-800 bg-zinc-900 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calculator className="h-5 w-5 text-amber-400" />
              Simulation Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-zinc-300">Initial Investment (TZS)</Label>
              <Input
                type="number"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(Number(e.target.value))}
                className="border-zinc-700 bg-zinc-800 text-white"
                min={0}
              />
              <p className="text-xs text-zinc-500">{formatTZS(initialInvestment)}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Monthly Contribution (TZS)</Label>
              <Input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="border-zinc-700 bg-zinc-800 text-white"
                min={0}
              />
              <p className="text-xs text-zinc-500">{formatTZS(monthlyContribution)}/month</p>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">
                Investment Horizon: {horizonYears} years
              </Label>
              <Slider
                value={[horizonYears]}
                onValueChange={([v]) => setHorizonYears(v)}
                min={1}
                max={30}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-zinc-600">
                <span>1 year</span>
                <span>30 years</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Risk Tolerance</Label>
              <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-800">
                  <SelectItem value="CONSERVATIVE" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">
                    Conservative — Lower risk, stable returns
                  </SelectItem>
                  <SelectItem value="MODERATE" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">
                    Moderate — Balanced risk and growth
                  </SelectItem>
                  <SelectItem value="AGGRESSIVE" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">
                    Aggressive — Higher risk, higher potential
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSimulate}
              disabled={loading}
              className="w-full bg-amber-400 text-black hover:bg-amber-500"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="mr-2 h-4 w-4" />
              )}
              {loading ? "Simulating..." : "Run Simulation"}
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="space-y-6 lg:col-span-2">
          {!result && !loading && (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="flex flex-col items-center py-16">
                <BarChart3 className="mb-4 h-12 w-12 text-zinc-700" />
                <p className="text-sm text-zinc-500">
                  Configure your parameters and click &quot;Run Simulation&quot; to see projected returns
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
              </CardContent>
            </Card>
          )}

          {result && !loading && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Target className="h-4 w-4" />
                      <span className="text-xs">Expected Value</span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-white">
                      {formatTZS(result.finalExpected)}
                    </p>
                    <p className="text-xs text-zinc-500">after {horizonYears} years</p>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <ArrowUpRight className="h-4 w-4" />
                      <span className="text-xs">Expected Profit</span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-green-400">
                      +{formatTZS(result.expectedProfit)}
                    </p>
                    <p className="text-xs text-zinc-500">+{result.expectedReturnPct}% total return</p>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Wallet className="h-4 w-4" />
                      <span className="text-xs">Total Invested</span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-white">
                      {formatTZS(result.totalInvested)}
                    </p>
                    <p className="text-xs text-zinc-500">{result.expectedAnnualReturn}% annual return</p>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <PiggyBank className="h-4 w-4" />
                      <span className="text-xs">Annual Dividends</span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-amber-400">
                      {formatTZS(result.expectedDividendIncome)}
                    </p>
                    <p className="text-xs text-zinc-500">projected at maturity</p>
                  </CardContent>
                </Card>
              </div>

              {/* Projection Chart */}
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    Growth Projection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart
                      data={result.projections}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="gradOptimistic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradExpected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradPessimistic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="year"
                        stroke="#71717a"
                        fontSize={12}
                        tickFormatter={(v) => `Yr ${v}`}
                      />
                      <YAxis
                        stroke="#71717a"
                        fontSize={12}
                        tickFormatter={(v) => {
                          if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
                          if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
                          if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
                          return `${v}`;
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "1px solid #3f3f46",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#a1a1aa" }}
                        labelFormatter={(v) => `Year ${v}`}
                        formatter={(value, name) => [
                          formatTZS(Number(value ?? 0)),
                          name === "optimistic"
                            ? "Best Case"
                            : name === "expected"
                              ? "Expected"
                              : "Conservative",
                        ]}
                      />
                      <Legend
                        formatter={(value) =>
                          value === "optimistic"
                            ? "Best Case"
                            : value === "expected"
                              ? "Expected"
                              : "Conservative"
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="optimistic"
                        stroke="#22c55e"
                        strokeWidth={1.5}
                        fill="url(#gradOptimistic)"
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="expected"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        fill="url(#gradExpected)"
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="pessimistic"
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        fill="url(#gradPessimistic)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Scenario Comparison */}
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Banknote className="h-5 w-5 text-amber-400" />
                    Scenario Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-green-400/10 p-4">
                      <div>
                        <p className="text-sm font-medium text-green-400">Best Case</p>
                        <p className="text-xs text-zinc-500">If markets outperform</p>
                      </div>
                      <p className="text-lg font-bold text-green-400">
                        {formatTZS(result.finalOptimistic)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-amber-400/10 p-4">
                      <div>
                        <p className="text-sm font-medium text-amber-400">Expected</p>
                        <p className="text-xs text-zinc-500">Based on historical averages</p>
                      </div>
                      <p className="text-lg font-bold text-amber-400">
                        {formatTZS(result.finalExpected)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-red-400/10 p-4">
                      <div>
                        <p className="text-sm font-medium text-red-400">Conservative</p>
                        <p className="text-xs text-zinc-500">If markets underperform</p>
                      </div>
                      <p className="text-lg font-bold text-red-400">
                        {formatTZS(result.finalPessimistic)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
