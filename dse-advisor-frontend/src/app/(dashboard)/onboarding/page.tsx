"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { CREATE_PROFILE_MUTATION, UPDATE_PROFILE_MUTATION } from "@/lib/graphql/mutations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Shield,
  Target,
  Clock,
  TrendingUp,
  Loader2,
  Sparkles,
} from "lucide-react";

/* ---------- Questionnaire Questions ---------- */

interface Question {
  id: string;
  question: string;
  description: string;
  options: { value: number; label: string; description: string }[];
}

const RISK_QUESTIONS: Question[] = [
  {
    id: "reaction",
    question: "How would you react if your portfolio dropped 20% in one month?",
    description: "This helps us understand your emotional tolerance for risk.",
    options: [
      { value: 1, label: "Sell everything immediately", description: "Protecting capital is my top priority" },
      { value: 2, label: "Sell some positions", description: "I'd reduce my exposure to limit further losses" },
      { value: 3, label: "Hold and wait", description: "Markets recover — I'd wait it out" },
      { value: 4, label: "Buy more at lower prices", description: "Dips are buying opportunities" },
    ],
  },
  {
    id: "experience",
    question: "How much investment experience do you have?",
    description: "Your experience level helps us calibrate recommendations.",
    options: [
      { value: 1, label: "Complete beginner", description: "This is my first time investing" },
      { value: 2, label: "Some knowledge", description: "I understand basic concepts like stocks and bonds" },
      { value: 3, label: "Intermediate", description: "I've invested before and understand risk/return" },
      { value: 4, label: "Experienced investor", description: "I actively manage investments and understand portfolio theory" },
    ],
  },
  {
    id: "priority",
    question: "What matters more to you?",
    description: "This shapes your portfolio's balance between growth and stability.",
    options: [
      { value: 1, label: "Protecting my money from loss", description: "Capital preservation is key" },
      { value: 2, label: "Steady, predictable income", description: "Regular dividends and low volatility" },
      { value: 3, label: "Balanced growth and income", description: "Some growth with reasonable dividends" },
      { value: 4, label: "Maximum growth potential", description: "I want the highest returns, even with high risk" },
    ],
  },
  {
    id: "timeline",
    question: "When will you need to access this money?",
    description: "Longer time horizons allow for more aggressive strategies.",
    options: [
      { value: 1, label: "Within 1-2 years", description: "I may need this money soon" },
      { value: 2, label: "3-5 years", description: "Medium-term savings" },
      { value: 3, label: "5-10 years", description: "Long-term wealth building" },
      { value: 4, label: "10+ years", description: "Retirement or long-term goals" },
    ],
  },
  {
    id: "income_stability",
    question: "How stable is your income?",
    description: "Stable income means you can afford more investment risk.",
    options: [
      { value: 1, label: "Irregular / Freelance", description: "My income varies significantly month to month" },
      { value: 2, label: "Somewhat stable", description: "Most months are predictable but some variation" },
      { value: 3, label: "Stable employment", description: "I have a regular salary" },
      { value: 4, label: "Very stable with savings", description: "Secure income plus emergency fund in place" },
    ],
  },
];

const GOALS = [
  { value: "WEALTH", label: "Wealth Growth", icon: TrendingUp, description: "Grow your capital over time through stock appreciation" },
  { value: "INCOME", label: "Dividend Income", icon: Target, description: "Generate regular income from dividends" },
  { value: "RETIREMENT", label: "Retirement", icon: Clock, description: "Build a nest egg for your retirement years" },
  { value: "EDUCATION", label: "Education Fund", icon: Sparkles, description: "Save for education expenses" },
];

function computeRiskProfile(answers: Record<string, number>): { score: number; tolerance: string; description: string } {
  const values = Object.values(answers);
  if (values.length === 0) return { score: 50, tolerance: "MODERATE", description: "" };

  const total = values.reduce((a, b) => a + b, 0);
  const maxPossible = values.length * 4;
  const score = Math.round((total / maxPossible) * 100);

  if (score <= 35) {
    return {
      score,
      tolerance: "CONSERVATIVE",
      description: "You prefer stability and capital preservation. Your portfolio will focus on bonds and dividend-paying stocks with lower volatility.",
    };
  } else if (score <= 65) {
    return {
      score,
      tolerance: "MODERATE",
      description: "You want balanced growth with manageable risk. Your portfolio will mix growth stocks with income-generating assets.",
    };
  } else {
    return {
      score,
      tolerance: "AGGRESSIVE",
      description: "You're comfortable with higher risk for potentially higher returns. Your portfolio will emphasize growth stocks.",
    };
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"welcome" | "questionnaire" | "financials" | "result">("welcome");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [capitalAvailable, setCapitalAvailable] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("WEALTH");
  const [investmentHorizon, setInvestmentHorizon] = useState(5);
  const [saving, setSaving] = useState(false);

  const [createProfile] = useMutation(CREATE_PROFILE_MUTATION);
  const [updateProfile] = useMutation(UPDATE_PROFILE_MUTATION);

  const riskResult = computeRiskProfile(answers);
  const progress = phase === "welcome" ? 0
    : phase === "questionnaire" ? ((currentQuestion + 1) / RISK_QUESTIONS.length) * 60
    : phase === "financials" ? 80
    : 100;

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (currentQuestion < RISK_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion((q) => q + 1), 300);
    } else {
      setTimeout(() => setPhase("financials"), 500);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const horizonFromAnswers = answers.timeline === 1 ? 2 : answers.timeline === 2 ? 4 : answers.timeline === 3 ? 7 : 15;
    const profileInput = {
      monthlyIncome: parseFloat(monthlyIncome) || 0,
      capitalAvailable: parseFloat(capitalAvailable) || 1000000,
      riskTolerance: riskResult.tolerance,
      investmentHorizon: investmentHorizon || horizonFromAnswers,
      primaryGoal,
    };

    try {
      await createProfile({ variables: { input: profileInput } });
    } catch {
      try {
        await updateProfile({ variables: { input: profileInput } });
      } catch {
        // Ignore — profile might already exist
      }
    }
    setSaving(false);
    setPhase("result");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Welcome Screen */}
      {phase === "welcome" && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600">
              <Shield className="h-8 w-8 text-black" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              Welcome to DSE Advisor
            </h1>
            <p className="mb-2 max-w-md text-sm text-zinc-400">
              Let&apos;s build your personalized investment strategy. We&apos;ll ask you a few
              questions to understand your risk tolerance and financial goals.
            </p>
            <p className="mb-8 text-xs text-zinc-500">
              Takes about 2 minutes — your answers shape your portfolio recommendations.
            </p>
            <Button
              onClick={() => setPhase("questionnaire")}
              className="bg-amber-400 px-8 text-black hover:bg-amber-500"
            >
              Get Started
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Risk Questionnaire */}
      {phase === "questionnaire" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              Question {currentQuestion + 1} of {RISK_QUESTIONS.length}
            </p>
            {currentQuestion > 0 && (
              <button
                onClick={() => setCurrentQuestion((q) => q - 1)}
                className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
            )}
          </div>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="py-8">
              <h2 className="mb-2 text-lg font-semibold text-white">
                {RISK_QUESTIONS[currentQuestion].question}
              </h2>
              <p className="mb-6 text-sm text-zinc-500">
                {RISK_QUESTIONS[currentQuestion].description}
              </p>
              <div className="space-y-3">
                {RISK_QUESTIONS[currentQuestion].options.map((option) => {
                  const isSelected = answers[RISK_QUESTIONS[currentQuestion].id] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(RISK_QUESTIONS[currentQuestion].id, option.value)}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-amber-400 bg-amber-400/10"
                          : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                      }`}
                    >
                      <p className={`text-sm font-medium ${isSelected ? "text-amber-400" : "text-white"}`}>
                        {option.label}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Details */}
      {phase === "financials" && (
        <div className="space-y-6">
          {/* Risk Score Preview */}
          <Card className="border-amber-400/20 bg-zinc-900">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Your Risk Profile</p>
                  <p className="text-lg font-bold text-amber-400">
                    {riskResult.tolerance.charAt(0) + riskResult.tolerance.slice(1).toLowerCase()}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-400">
                  <span className="text-lg font-bold text-amber-400">{riskResult.score}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-500">{riskResult.description}</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="space-y-5 py-6">
              <h2 className="text-lg font-semibold text-white">Financial Details</h2>

              <div className="space-y-2">
                <Label className="text-zinc-300">Monthly Income (TZS)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 2,000,000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Capital Available to Invest (TZS)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5,000,000"
                  value={capitalAvailable}
                  onChange={(e) => setCapitalAvailable(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Investment Horizon (years)</Label>
                <Input
                  type="number"
                  value={investmentHorizon}
                  onChange={(e) => setInvestmentHorizon(Number(e.target.value))}
                  min={1}
                  max={30}
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-300">Primary Investment Goal</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {GOALS.map((goal) => {
                    const isSelected = primaryGoal === goal.value;
                    return (
                      <button
                        key={goal.value}
                        onClick={() => setPrimaryGoal(goal.value)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-amber-400 bg-amber-400/10"
                            : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                        }`}
                      >
                        <goal.icon className={`mb-2 h-5 w-5 ${isSelected ? "text-amber-400" : "text-zinc-500"}`} />
                        <p className={`text-sm font-medium ${isSelected ? "text-amber-400" : "text-white"}`}>
                          {goal.label}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">{goal.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPhase("questionnaire");
                    setCurrentQuestion(RISK_QUESTIONS.length - 1);
                  }}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving || !capitalAvailable}
                  className="bg-amber-400 text-black hover:bg-amber-500"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {saving ? "Saving..." : "Complete Setup"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Result */}
      {phase === "result" && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CheckCircle2 className="mb-4 h-16 w-16 text-green-400" />
            <h2 className="mb-2 text-2xl font-bold text-white">You&apos;re All Set!</h2>
            <p className="mb-2 text-sm text-zinc-400">
              Your investor profile has been saved. Based on your answers:
            </p>
            <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/5 px-6 py-4">
              <p className="text-sm text-zinc-400">Risk Profile</p>
              <p className="text-xl font-bold text-amber-400">
                {riskResult.tolerance.charAt(0) + riskResult.tolerance.slice(1).toLowerCase()}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Score: {riskResult.score}/100</p>
            </div>
            <p className="mb-8 max-w-md text-xs text-zinc-500">
              {riskResult.description}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/advisor")}
                className="bg-amber-400 text-black hover:bg-amber-500"
              >
                Generate Portfolio
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/simulator")}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Try Simulator
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
