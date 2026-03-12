"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GENERATE_PORTFOLIO_MUTATION, CREATE_PROFILE_MUTATION } from "@/lib/graphql/mutations";
import { MY_PROFILE_QUERY } from "@/lib/graphql/queries";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AllocationChart } from "@/components/portfolio/AllocationChart";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { MetricsGrid } from "@/components/portfolio/MetricsGrid";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  BotMessageSquare,
} from "lucide-react";

interface Holding {
  symbol: string;
  name: string;
  allocationPct: number;
  dividendYield: number;
  sector: string;
  rationale: string;
}

interface Metrics {
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  projectedAnnualDividend: number;
  holdingsCount: number;
}

interface PortfolioResult {
  id: string;
  name: string;
  riskProfile: string;
  holdings: Holding[];
  metrics: Metrics;
}

const RISK_LEVELS = ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"];

const GOALS = [
  { value: "CAPITAL_GROWTH", label: "Capital Growth" },
  { value: "INCOME_GENERATION", label: "Income Generation" },
  { value: "BALANCED", label: "Balanced" },
  { value: "CAPITAL_PRESERVATION", label: "Capital Preservation" },
];

export default function AdvisorPage() {
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [capitalAvailable, setCapitalAvailable] = useState("");
  const [riskTolerance, setRiskTolerance] = useState("MODERATE");
  const [investmentHorizon, setInvestmentHorizon] = useState([5]);
  const [primaryGoal, setPrimaryGoal] = useState("BALANCED");
  const [portfolioName, setPortfolioName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortfolioResult | null>(null);

  const { data: profileData } = useQuery(MY_PROFILE_QUERY);

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pd = profileData as Record<string, any>;
    if (pd?.myProfile) {
      const p = pd.myProfile;
      if (p.monthlyIncome) setMonthlyIncome(p.monthlyIncome.toString());
      if (p.capitalAvailable) setCapitalAvailable(p.capitalAvailable.toString());
      if (p.riskTolerance) setRiskTolerance(p.riskTolerance);
      if (p.investmentHorizon) setInvestmentHorizon([p.investmentHorizon]);
      if (p.primaryGoal) setPrimaryGoal(p.primaryGoal);
    }
  }, [profileData]);

  const [createProfile] = useMutation(CREATE_PROFILE_MUTATION);
  const [generatePortfolio, { loading: generating }] = useMutation(
    GENERATE_PORTFOLIO_MUTATION
  );

  const handleProfileSubmit = async () => {
    setError(null);
    try {
      await createProfile({
        variables: {
          input: {
            monthlyIncome: parseFloat(monthlyIncome),
            capitalAvailable: parseFloat(capitalAvailable),
            riskTolerance,
            investmentHorizon: investmentHorizon[0],
            primaryGoal,
          },
        },
      });
      setStep(2);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save profile. Please try again.");
      }
    }
  };

  const handleGenerate = async () => {
    setError(null);
    try {
      const { data } = await generatePortfolio({
        variables: {
          input: {
            name: portfolioName,
            riskTolerance,
            investmentHorizon: investmentHorizon[0],
            primaryGoal,
            capitalAvailable: parseFloat(capitalAvailable),
          },
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setResult((data as Record<string, any>).generatePortfolio);
      setStep(4);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to generate portfolio. Please try again.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Portfolio Advisor</h1>
        <p className="text-sm text-zinc-400">
          Build your optimized DSE portfolio in a few steps
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                s === step
                  ? "bg-amber-400 text-black"
                  : s < step
                  ? "bg-amber-400/20 text-amber-400"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {s < step ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                s
              )}
            </div>
            {s < 4 && (
              <div
                className={`h-0.5 flex-1 ${
                  s < step ? "bg-amber-400/40" : "bg-zinc-800"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Investor Profile */}
      {step === 1 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Investor Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-300">Monthly Income (TZS)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 2,000,000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
                {monthlyIncome && (
                  <p className="text-xs text-zinc-500">
                    TZS {parseFloat(monthlyIncome).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">
                  Capital Available (TZS)
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 10,000,000"
                  value={capitalAvailable}
                  onChange={(e) => setCapitalAvailable(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
                {capitalAvailable && (
                  <p className="text-xs text-zinc-500">
                    TZS {parseFloat(capitalAvailable).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-zinc-300">Risk Tolerance</Label>
              <ToggleGroup
                type="single"
                value={riskTolerance}
                onValueChange={(value) => {
                  if (value) setRiskTolerance(value);
                }}
                className="justify-start"
              >
                {RISK_LEVELS.map((level) => (
                  <ToggleGroupItem
                    key={level}
                    value={level}
                    variant="outline"
                    className={`border-zinc-700 px-4 ${
                      riskTolerance === level
                        ? "border-amber-400 bg-amber-400/10 text-amber-400"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {level.charAt(0) + level.slice(1).toLowerCase()}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-zinc-300">
                Investment Horizon: {investmentHorizon[0]} years
              </Label>
              <Slider
                value={investmentHorizon}
                onValueChange={setInvestmentHorizon}
                max={30}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>1 year</span>
                <span>15 years</span>
                <span>30 years</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Primary Goal</Label>
              <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-800">
                  {GOALS.map((goal) => (
                    <SelectItem
                      key={goal.value}
                      value={goal.value}
                      className="text-zinc-200 focus:bg-zinc-700 focus:text-white"
                    >
                      {goal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleProfileSubmit}
                className="bg-amber-400 text-black hover:bg-amber-500"
                disabled={!monthlyIncome || !capitalAvailable}
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Portfolio Name */}
      {step === 2 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Name Your Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-zinc-300">Portfolio Name</Label>
              <Input
                type="text"
                placeholder="e.g. My Growth Portfolio"
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-amber-400 text-black hover:bg-amber-500"
                disabled={!portfolioName.trim()}
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Generate */}
      {step === 3 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Generate Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
              <h3 className="mb-4 text-sm font-medium text-zinc-400">
                Portfolio Configuration Summary
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-zinc-500">Portfolio Name</p>
                  <p className="text-sm text-white">{portfolioName}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Risk Tolerance</p>
                  <p className="text-sm text-white">
                    {riskTolerance.charAt(0) +
                      riskTolerance.slice(1).toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Investment Horizon</p>
                  <p className="text-sm text-white">
                    {investmentHorizon[0]} years
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Primary Goal</p>
                  <p className="text-sm text-white">
                    {GOALS.find((g) => g.value === primaryGoal)?.label}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Capital Available</p>
                  <p className="text-sm text-white">
                    TZS {parseFloat(capitalAvailable).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Monthly Income</p>
                  <p className="text-sm text-white">
                    TZS {parseFloat(monthlyIncome).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                className="bg-amber-400 text-black hover:bg-amber-500"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BotMessageSquare className="mr-2 h-4 w-4" />
                    Generate Portfolio
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === 4 && result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{result.name}</h2>
              <p className="text-sm text-zinc-400">
                Risk Profile:{" "}
                <span className="text-amber-400">{result.riskProfile}</span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setResult(null);
                setPortfolioName("");
              }}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Create Another
            </Button>
          </div>

          <MetricsGrid metrics={result.metrics} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">
                  Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AllocationChart holdings={result.holdings} />
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <HoldingsTable holdings={result.holdings} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
