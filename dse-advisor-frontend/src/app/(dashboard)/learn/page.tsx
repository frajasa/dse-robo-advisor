"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  TrendingUp,
  Shield,
  PieChart,
  Banknote,
  BarChart3,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  RefreshCw,
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  summary: string;
  content: string[];
  tip?: string;
}

const ARTICLES: Article[] = [
  {
    id: "what-is-dse",
    title: "What is the Dar es Salaam Stock Exchange (DSE)?",
    category: "Basics",
    icon: TrendingUp,
    summary: "The DSE is Tanzania's primary stock exchange where companies list their shares for public trading.",
    content: [
      "The Dar es Salaam Stock Exchange (DSE) was established in 1998 and is regulated by the Capital Markets and Securities Authority (CMSA). It is the main marketplace for buying and selling shares of Tanzanian companies.",
      "Companies like NMB Bank, CRDB Bank, and Tanzania Breweries Limited (TBL) are listed on the DSE. When you buy shares, you become a partial owner of that company.",
      "The DSE operates Monday to Friday. Stock prices change based on supply and demand — if more people want to buy a stock than sell it, the price goes up, and vice versa.",
      "To invest on the DSE, you need a Central Depository System (CDS) account and a licensed broker. The DSE Advisor app helps you decide which stocks to buy and in what proportions.",
    ],
    tip: "You don't need millions to start investing on the DSE. Many stocks can be purchased for as little as TZS 500,000.",
  },
  {
    id: "risk-tolerance",
    title: "Understanding Risk Tolerance",
    category: "Risk",
    icon: Shield,
    summary: "Your risk tolerance determines how much market volatility you can handle without making emotional decisions.",
    content: [
      "Risk tolerance is your ability and willingness to endure drops in the value of your investments. It's one of the most important factors in building your portfolio.",
      "Conservative investors prefer stability. Their portfolios include more bonds and dividend-paying stocks. Returns are lower, but so is the chance of losing money. Example: 35% stocks, 65% bonds.",
      "Moderate investors accept some ups and downs for better growth. They balance growth stocks with stable income investments. Example: 60% stocks, 40% bonds.",
      "Aggressive investors are comfortable with high volatility in pursuit of maximum returns. Their portfolios are heavily weighted toward growth stocks. Example: 90% stocks, 10% bonds.",
      "Your risk tolerance isn't fixed — it can change as your income grows, your goals change, or you get closer to needing the money.",
    ],
    tip: "\"You have more bonds because your risk tolerance is low.\" — This is how we explain recommendations. If your portfolio seems too conservative, you can retake the risk assessment.",
  },
  {
    id: "diversification",
    title: "Why Diversification Matters",
    category: "Strategy",
    icon: PieChart,
    summary: "Don't put all your eggs in one basket. Spreading investments across sectors reduces risk.",
    content: [
      "Diversification means spreading your money across different investments so that poor performance in one doesn't devastate your whole portfolio.",
      "On the DSE, you can diversify across sectors: Banking (NMB, CRDB), Consumer goods (TBL), Telecom (Vodacom), Insurance (NIC), and fixed-income bonds.",
      "If banking stocks drop due to regulatory changes, your telecom and consumer stocks may still perform well, cushioning the overall impact.",
      "The DSE Advisor automatically diversifies your portfolio based on your risk profile. Our optimizer uses Modern Portfolio Theory to find the ideal mix of assets that maximizes returns for your chosen risk level.",
    ],
    tip: "Our optimizer won't put more than 30-35% of your portfolio in a single stock. This concentration limit protects you from company-specific risk.",
  },
  {
    id: "dividends",
    title: "How Dividends Work on the DSE",
    category: "Income",
    icon: Banknote,
    summary: "Dividends are your share of company profits, paid regularly to shareholders.",
    content: [
      "When DSE companies make a profit, they may distribute a portion to shareholders as dividends. This is passive income from your investments.",
      "DSE companies typically pay dividends once or twice a year. Major payout months are usually June and December, with some companies paying in March and September.",
      "Dividend yield measures how much dividend income you get relative to the stock price. For example, if NMB's share price is TZS 3,000 and it pays TZS 240 in annual dividends, the yield is 8%.",
      "Dividends are especially important for conservative and income-focused portfolios. Companies like NMB Bank and NIC Insurance have historically offered attractive dividend yields.",
      "Dividends are subject to a 5% withholding tax in Tanzania for residents. This is automatically deducted before payment.",
    ],
    tip: "Reinvesting your dividends — buying more shares with the dividend income — can dramatically grow your wealth through compounding over time.",
  },
  {
    id: "rebalancing",
    title: "Portfolio Rebalancing Explained",
    category: "Strategy",
    icon: RefreshCw,
    summary: "Rebalancing keeps your portfolio aligned with your intended risk level.",
    content: [
      "Over time, some stocks grow faster than others, causing your portfolio's actual allocation to drift from the target. For example, if banking stocks surge, they might become 50% of your portfolio instead of the intended 35%.",
      "Rebalancing means selling some of the outperformers and buying more of the underperformers to restore your target allocation.",
      "This feels counterintuitive — selling winners and buying laggards — but it's a disciplined strategy that locks in gains and buys assets at lower prices.",
      "The DSE Advisor checks for portfolio drift daily. When any holding drifts more than 5% from its target, you'll receive a rebalancing alert with specific buy/sell recommendations.",
    ],
    tip: "Don't rebalance too frequently — transaction costs add up. Quarterly rebalancing or drift-based rebalancing (when allocations shift by more than 5%) is typically optimal.",
  },
  {
    id: "compound-growth",
    title: "The Power of Compound Growth",
    category: "Basics",
    icon: BarChart3,
    summary: "Time is your greatest asset. Starting early makes a massive difference.",
    content: [
      "Compound growth means your returns earn returns. If you invest TZS 1,000,000 and earn 10% in year one, you have TZS 1,100,000. In year two, you earn 10% on TZS 1,100,000 — that's TZS 1,210,000.",
      "The difference between starting at age 25 versus 35 is enormous. With TZS 300,000/month at 10% annual returns: starting at 25 gives you ~TZS 680M by 60, while starting at 35 gives you ~TZS 230M. That's a TZS 450M difference!",
      "This is why regular monthly contributions matter so much. Even small amounts, invested consistently, can grow to significant sums over time.",
      "Use our Investment Simulator to see exactly how your money could grow. Try different scenarios — change your monthly contribution, time horizon, and risk level to see the impact.",
    ],
    tip: "If you invest TZS 300,000/month with moderate risk: after 5 years you could have ~TZS 22M, after 10 years ~TZS 55M. Time in the market beats timing the market.",
  },
  {
    id: "portfolio-metrics",
    title: "Understanding Portfolio Metrics",
    category: "Analytics",
    icon: Target,
    summary: "Learn what expected return, volatility, and Sharpe ratio actually mean for your money.",
    content: [
      "Expected Return is the average annual return your portfolio should generate based on historical data and asset characteristics. An 8% expected return means your TZS 10M portfolio should grow by ~TZS 800,000 per year on average.",
      "Volatility (standard deviation) measures how much your portfolio value swings up and down. Higher volatility means bigger potential gains AND bigger potential losses. A 10% volatility means your returns could typically range from -2% to +18% in any given year.",
      "The Sharpe Ratio measures risk-adjusted returns — how much return you get per unit of risk. Higher is better. A Sharpe ratio above 1.0 is considered good; above 2.0 is excellent.",
      "Projected Dividend Income estimates the annual passive income from dividends based on your portfolio's dividend yields and allocation.",
    ],
    tip: "Don't chase the highest expected return alone. A portfolio with 12% return and 15% volatility might be worse than one with 10% return and 7% volatility, depending on your risk tolerance.",
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(ARTICLES.map((a) => a.category)))];

export default function LearnPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filteredArticles =
    selectedCategory === "All"
      ? ARTICLES
      : ARTICLES.filter((a) => a.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Learn</h1>
        <p className="text-sm text-zinc-400">
          Understand how investing works and why we make the recommendations we do
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              selectedCategory === cat
                ? "bg-amber-400 text-black"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-amber-400/20 bg-gradient-to-br from-amber-400/5 to-transparent">
          <CardContent className="p-4">
            <Lightbulb className="mb-2 h-5 w-5 text-amber-400" />
            <p className="text-sm text-zinc-300">
              <span className="font-medium text-amber-400">Did you know?</span>{" "}
              The DSE has returned an average of ~10% annually over the past decade, outperforming
              bank savings accounts.
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-400/20 bg-gradient-to-br from-green-400/5 to-transparent">
          <CardContent className="p-4">
            <TrendingUp className="mb-2 h-5 w-5 text-green-400" />
            <p className="text-sm text-zinc-300">
              <span className="font-medium text-green-400">Why diversify?</span>{" "}
              Banking stocks and consumer stocks often move independently — owning both
              reduces your overall risk.
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-400/20 bg-gradient-to-br from-blue-400/5 to-transparent">
          <CardContent className="p-4">
            <Shield className="mb-2 h-5 w-5 text-blue-400" />
            <p className="text-sm text-zinc-300">
              <span className="font-medium text-blue-400">Risk tip:</span>{" "}
              Your risk tolerance should match your time horizon. Longer horizons
              can handle more volatility.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {filteredArticles.map((article) => {
          const isExpanded = expandedArticle === article.id;
          return (
            <Card key={article.id} className="border-zinc-800 bg-zinc-900">
              <button
                onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                className="w-full text-left"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg bg-zinc-800 p-2">
                        <article.icon className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-white">
                          {article.title}
                        </CardTitle>
                        <p className="mt-1 text-sm text-zinc-400">{article.summary}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        {article.category}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-zinc-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-zinc-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </button>

              {isExpanded && (
                <CardContent className="space-y-4 pt-0">
                  <div className="ml-11 space-y-3 border-l-2 border-zinc-800 pl-4">
                    {article.content.map((paragraph, idx) => (
                      <p key={idx} className="text-sm leading-relaxed text-zinc-300">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {article.tip && (
                    <div className="ml-11 rounded-lg bg-amber-400/5 border border-amber-400/20 p-4">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        <p className="text-sm text-amber-200">{article.tip}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* CTA */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-white">Ready to put your knowledge to work?</p>
              <p className="text-xs text-zinc-500">Build your first portfolio or try the simulator</p>
            </div>
          </div>
          <a
            href="/advisor"
            className="flex items-center gap-1 rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-black hover:bg-amber-500"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
