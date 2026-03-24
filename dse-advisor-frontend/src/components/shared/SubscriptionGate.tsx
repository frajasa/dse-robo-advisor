"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { ME_QUERY } from "@/lib/graphql/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface SubscriptionGateProps {
  requiredTier?: "PREMIUM" | "ENTERPRISE";
  children: React.ReactNode;
  featureName?: string;
}

export function SubscriptionGate({
  requiredTier = "PREMIUM",
  children,
  featureName = "This feature",
}: SubscriptionGateProps) {
  const { data } = useQuery(ME_QUERY);
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const me = (data as Record<string, any>)?.me;
  const userTier = me?.subscription?.tier || "FREE";
  const tierOrder = { FREE: 0, PREMIUM: 1, ENTERPRISE: 2 };
  const hasAccess =
    (tierOrder[userTier as keyof typeof tierOrder] || 0) >=
    (tierOrder[requiredTier] || 0);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <Card className="border-amber-400/20 bg-zinc-900">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Lock className="mb-4 h-10 w-10 text-amber-400" />
        <h3 className="mb-2 text-lg font-semibold text-white">
          {requiredTier} Feature
        </h3>
        <p className="mb-6 max-w-md text-center text-sm text-zinc-400">
          {featureName} is available on the {requiredTier.toLowerCase()} plan.
          Upgrade to unlock advanced analytics, rebalancing alerts, and more.
        </p>
        <Button
          onClick={() => router.push("/pricing")}
          className="bg-amber-400 text-black hover:bg-amber-500"
        >
          Upgrade to {requiredTier.charAt(0) + requiredTier.slice(1).toLowerCase()}
        </Button>
      </CardContent>
    </Card>
  );
}
