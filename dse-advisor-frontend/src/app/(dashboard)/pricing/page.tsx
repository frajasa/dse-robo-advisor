"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { ME_QUERY } from "@/lib/graphql/queries";
import { UPGRADE_SUBSCRIPTION_MUTATION } from "@/lib/graphql/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { MobileMoneyDialog } from "@/components/payment/MobileMoneyDialog";

const PLANS = [
  {
    name: "Free",
    tier: "FREE",
    price: "TZS 0",
    amount: "TZS 0",
    period: "",
    description: "Get started with basic portfolio tools",
    features: [
      "1 portfolio",
      "Basic stock data",
      "Market overview",
      "Portfolio generation",
    ],
    buttonLabel: "Get Started",
  },
  {
    name: "Premium",
    tier: "PREMIUM",
    price: "TZS 15,000",
    amount: "TZS 15,000",
    period: "month",
    description: "Advanced analytics and unlimited portfolios",
    features: [
      "Unlimited portfolios",
      "Advanced analytics & charts",
      "Sector allocation analysis",
      "Dividend projections",
      "Real-time market alerts",
      "Portfolio rebalancing",
    ],
    highlighted: true,
    buttonLabel: "Upgrade to Premium",
  },
  {
    name: "Enterprise",
    tier: "ENTERPRISE",
    price: "TZS 50,000",
    amount: "TZS 50,000",
    period: "month",
    description: "Full platform access for professional investors",
    features: [
      "Everything in Premium",
      "API access",
      "Custom risk models",
      "Priority support",
      "Multi-user accounts",
      "White-label reports",
    ],
    buttonLabel: "Upgrade to Enterprise",
  },
];

export default function PricingPage() {
  const { data, refetch } = useQuery(ME_QUERY);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentTier = (data as Record<string, any>)?.me?.subscription?.tier || "FREE";
  const { toast } = useToast();

  const [upgradeSubscription, { loading: upgrading }] = useMutation(UPGRADE_SUBSCRIPTION_MUTATION);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);

  const handleSelectPlan = (plan: typeof PLANS[0]) => {
    if (plan.tier === "FREE") return;
    setSelectedPlan(plan);
    setPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPlan) return;
    try {
      await upgradeSubscription({ variables: { tier: selectedPlan.tier } });
      await refetch();
      toast({
        title: "Subscription activated!",
        description: `You are now on the ${selectedPlan.name} plan. Enjoy your new features!`,
      });
    } catch (err: unknown) {
      toast({
        title: "Upgrade failed",
        description: err instanceof Error ? err.message : "Payment received but upgrade failed. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const tierOrder: Record<string, number> = { FREE: 0, PREMIUM: 1, ENTERPRISE: 2 };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Choose Your Plan</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Unlock advanced features to make smarter investment decisions on the DSE
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.tier;
          const isDowngrade = (tierOrder[currentTier] || 0) > (tierOrder[plan.tier] || 0);

          return (
            <Card
              key={plan.tier}
              className={cn(
                "flex flex-col border-zinc-800 bg-zinc-900",
                plan.highlighted && "border-amber-400/50 ring-1 ring-amber-400/20"
              )}
            >
              <CardHeader>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm text-zinc-400">/{plan.period}</span>}
                </div>
                <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn(
                    "mt-6 w-full",
                    plan.highlighted
                      ? "bg-amber-400 text-black hover:bg-amber-500"
                      : "border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700",
                    (isCurrent || isDowngrade) && "cursor-default opacity-60"
                  )}
                  disabled={isCurrent || isDowngrade || (upgrading && selectedPlan?.tier === plan.tier)}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {upgrading && selectedPlan?.tier === plan.tier ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isCurrent ? "Current Plan" : isDowngrade ? "Current Plan is Higher" : plan.buttonLabel}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mobile Money Payment Dialog */}
      {selectedPlan && (
        <MobileMoneyDialog
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          onSuccess={handlePaymentSuccess}
          planName={selectedPlan.name}
          amount={selectedPlan.amount}
        />
      )}
    </div>
  );
}
