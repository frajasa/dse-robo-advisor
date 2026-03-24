"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "@/lib/auth/context";
import { ME_QUERY } from "@/lib/graphql/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LogOut,
  User,
  Shield,
  Crown,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { name: "Portfolio generation", free: "1 portfolio", premium: "Unlimited", enterprise: "Unlimited" },
  { name: "Market data", free: "15 min delay", premium: "Live", enterprise: "Live + API" },
  { name: "Rebalancing alerts", free: false, premium: true, enterprise: true },
  { name: "Dividend forecasts", free: "Basic", premium: "Advanced", enterprise: "Full export" },
  { name: "Analytics dashboard", free: false, premium: true, enterprise: true },
  { name: "Broker referral", free: false, premium: true, enterprise: true },
  { name: "White-label API", free: false, premium: false, enterprise: true },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-green-400" />
    ) : (
      <X className="mx-auto h-4 w-4 text-zinc-600" />
    );
  }
  return <span className="text-sm text-zinc-300">{value}</span>;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { data } = useQuery(ME_QUERY);
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const me = (data as Record<string, any>)?.me;
  const tier = me?.subscription?.tier || "FREE";

  const tierLabel: Record<string, string> = {
    FREE: "Free",
    PREMIUM: "Premium",
    ENTERPRISE: "Enterprise",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-400">
          Manage your account, subscription, and preferences
        </p>
      </div>

      {/* Account Info */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="h-5 w-5 text-amber-400" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Full Name</Label>
              <Input
                value={user?.fullName || ""}
                disabled
                className="border-zinc-700 bg-zinc-800 text-zinc-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="border-zinc-700 bg-zinc-800 text-zinc-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Subscription */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Crown className="h-5 w-5 text-amber-400" />
              Subscription
            </CardTitle>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                tier === "FREE" && "bg-zinc-800 text-zinc-300",
                tier === "PREMIUM" && "bg-amber-400/20 text-amber-400",
                tier === "ENTERPRISE" && "bg-purple-400/20 text-purple-400"
              )}
            >
              {tierLabel[tier] || tier}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            {tier === "FREE" && "You are on the Free plan. Upgrade to unlock advanced features."}
            {tier === "PREMIUM" && "You have Premium access with advanced analytics and unlimited portfolios."}
            {tier === "ENTERPRISE" && "Full Enterprise access with API and white-label features."}
          </p>
          {tier === "FREE" && (
            <Button
              onClick={() => router.push("/pricing")}
              className="bg-amber-400 text-black hover:bg-amber-500"
            >
              Upgrade Plan
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Feature Comparison Table */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Subscription Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-400">
                    Free
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-amber-400">
                    Premium (TZS 15,000/mo)
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-purple-400">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {FEATURES.map((feature) => (
                  <tr key={feature.name} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-2.5 text-sm text-zinc-300">
                      {feature.name}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <FeatureCell value={feature.free} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <FeatureCell value={feature.premium} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <FeatureCell value={feature.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-amber-400" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={logout}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
