import Link from "next/link";
import { LineChart, BarChart3, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: TrendingUp,
    title: "Portfolio Optimization",
    description:
      "AI-driven portfolio construction using Modern Portfolio Theory, optimized for the Dar es Salaam Stock Exchange.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Market Data",
    description:
      "Live stock prices and market data from the DSE, keeping your investment decisions informed and up-to-date.",
  },
  {
    icon: Wallet,
    title: "Dividend Forecasting",
    description:
      "Project your annual dividend income based on historical yields and optimized allocation strategies.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation */}
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <LineChart className="h-6 w-6 text-amber-400" />
            <span className="text-lg font-bold text-white">
              DSE <span className="text-amber-400">Robo-Advisor</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-400 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-amber-400 text-black hover:bg-amber-500">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          DSE{" "}
          <span className="text-amber-400">Robo-Advisor</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          AI-powered portfolio optimization for Tanzania&apos;s stock market.
          Build diversified, risk-adjusted portfolios tailored to your
          investment goals on the Dar es Salaam Stock Exchange.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/register">
            <Button
              size="lg"
              className="bg-amber-400 px-8 text-black hover:bg-amber-500"
            >
              Start Investing
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-zinc-800 bg-zinc-900 transition-colors hover:border-amber-400/30"
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-400/10">
                  <feature.icon className="h-6 w-6 text-amber-400" />
                </div>
                <CardTitle className="mt-4 text-white">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm text-zinc-500">
            DSE Robo-Advisor - AI-Powered Investment Advisory for the Dar es Salaam Stock Exchange
          </p>
        </div>
      </footer>
    </div>
  );
}
