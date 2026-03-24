"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { BROKERS_QUERY, MY_REFERRALS_QUERY } from "@/lib/graphql/queries";
import { CREATE_REFERRAL_MUTATION } from "@/lib/graphql/mutations";
import { SubscriptionGate } from "@/components/shared/SubscriptionGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle2,
  Link2,
  Users,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Broker {
  name: string;
  description: string;
  website: string;
  commission: string;
  logo: string;
  affiliateUrl: string;
}

interface Referral {
  id: string;
  brokerName: string;
  referralCode: string;
  status: string;
  commissionTzs: number | null;
  referredAt: string;
  convertedAt: string | null;
}

const LOGO_COLORS: Record<string, string> = {
  orbit: "bg-blue-500/20 text-blue-400",
  zan: "bg-green-500/20 text-green-400",
  vertex: "bg-purple-500/20 text-purple-400",
  core: "bg-amber-500/20 text-amber-400",
  solomon: "bg-red-500/20 text-red-400",
  tsl: "bg-cyan-500/20 text-cyan-400",
};

export default function BrokersPage() {
  const { data: brokersData, loading: brokersLoading } = useQuery(BROKERS_QUERY);
  const { data: referralsData, loading: referralsLoading, refetch: refetchReferrals } = useQuery(MY_REFERRALS_QUERY);
  const [createReferral, { loading: creating }] = useMutation(CREATE_REFERRAL_MUTATION);
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brokers: Broker[] = (brokersData as Record<string, any>)?.brokers || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const referrals: Referral[] = (referralsData as Record<string, any>)?.myReferrals || [];

  const handleGetLink = async (brokerName: string) => {
    try {
      const { data } = await createReferral({ variables: { brokerName } });
      await refetchReferrals();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const referral = (data as Record<string, any>)?.createReferral;
      toast({
        title: "Referral link created!",
        description: `Your code: ${referral?.referralCode}`,
      });
    } catch (err: unknown) {
      toast({
        title: "Failed to create referral",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: "Copied!", description: `Referral code ${code} copied to clipboard.` });
  };

  const getReferralForBroker = (brokerName: string) =>
    referrals.find((r) => r.brokerName === brokerName);

  const totalCommission = referrals
    .filter((r) => r.status === "CONFIRMED" && r.commissionTzs)
    .reduce((sum, r) => sum + (r.commissionTzs || 0), 0);

  const confirmedCount = referrals.filter((r) => r.status === "CONFIRMED").length;
  const pendingCount = referrals.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Broker Referrals</h1>
        <p className="text-sm text-zinc-400">
          Earn commissions by referring friends to DSE licensed brokers
        </p>
      </div>

      <SubscriptionGate requiredTier="PREMIUM" featureName="Broker Referrals">
        {/* Stats */}
        {referrals.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="flex items-center gap-3 p-4">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-xs text-zinc-400">Total Referrals</p>
                  <p className="text-2xl font-bold text-white">{referrals.length}</p>
                  <p className="text-xs text-zinc-500">
                    {pendingCount} pending, {confirmedCount} confirmed
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="flex items-center gap-3 p-4">
                <DollarSign className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-xs text-zinc-400">Total Earned</p>
                  <p className="text-2xl font-bold text-white">
                    TZS {totalCommission.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500">from confirmed referrals</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="flex items-center gap-3 p-4">
                <Link2 className="h-8 w-8 text-amber-400" />
                <div>
                  <p className="text-xs text-zinc-400">Active Links</p>
                  <p className="text-2xl font-bold text-white">{referrals.length}</p>
                  <p className="text-xs text-zinc-500">across {new Set(referrals.map((r) => r.brokerName)).size} brokers</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Broker List */}
        {brokersLoading || referralsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">
              DSE Licensed Brokers
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {brokers.map((broker) => {
                const referral = getReferralForBroker(broker.name);
                const colorClass = LOGO_COLORS[broker.logo] || "bg-zinc-800 text-zinc-400";

                return (
                  <Card key={broker.name} className="border-zinc-800 bg-zinc-900">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold",
                            colorClass
                          )}
                        >
                          {broker.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-white">{broker.name}</h3>
                          <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                            {broker.description}
                          </p>
                          <p className="mt-2 text-xs text-zinc-500">
                            Commission: {broker.commission}
                          </p>

                          {/* Referral code display */}
                          {referral && (
                            <div className="mt-3 flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
                              <code className="flex-1 text-sm font-mono text-amber-400">
                                {referral.referralCode}
                              </code>
                              <button
                                onClick={() => handleCopy(referral.referralCode)}
                                className="text-zinc-400 hover:text-white"
                              >
                                {copiedCode === referral.referralCode ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          )}

                          {referral && (
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                                  referral.status === "CONFIRMED"
                                    ? "bg-green-400/10 text-green-400"
                                    : "bg-amber-400/10 text-amber-400"
                                )}
                              >
                                {referral.status}
                              </span>
                              {referral.referredAt && (
                                <span className="text-xs text-zinc-500">
                                  {new Date(referral.referredAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="mt-3 flex gap-2">
                            {!referral ? (
                              <Button
                                size="sm"
                                onClick={() => handleGetLink(broker.name)}
                                disabled={creating}
                                className="bg-amber-400 text-black hover:bg-amber-500"
                              >
                                {creating ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <Link2 className="mr-1 h-3 w-3" />
                                )}
                                Get Referral Link
                              </Button>
                            ) : null}
                            <a
                              href={broker.affiliateUrl + (referral ? `?ref=${referral.referralCode}` : "")}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                              >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                Open Account
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* How to Start Trading on DSE */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">How to Start Trading on the DSE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 text-lg font-bold text-amber-400">
                  1
                </div>
                <h4 className="mb-1 text-sm font-medium text-white">Open a CDS Account</h4>
                <p className="text-xs text-zinc-400">
                  Visit any DSE-licensed broker with your ID/passport, TIN, and proof of address.
                  They&apos;ll open a Central Depository System (CDS) account for you.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 text-lg font-bold text-amber-400">
                  2
                </div>
                <h4 className="mb-1 text-sm font-medium text-white">Fund Your Account</h4>
                <p className="text-xs text-zinc-400">
                  Transfer funds to your broker&apos;s trading account. Most brokers accept
                  bank transfers and mobile money (M-Pesa, Tigo Pesa).
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 text-lg font-bold text-amber-400">
                  3
                </div>
                <h4 className="mb-1 text-sm font-medium text-white">Place Your Orders</h4>
                <p className="text-xs text-zinc-400">
                  Tell your broker which stocks to buy and in what quantities.
                  Use our portfolio recommendations as your guide.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 text-lg font-bold text-amber-400">
                  4
                </div>
                <h4 className="mb-1 text-sm font-medium text-white">Monitor & Rebalance</h4>
                <p className="text-xs text-zinc-400">
                  Use DSE Advisor to track your portfolio performance and get rebalancing
                  alerts when your allocation drifts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CDS Account Requirements */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">CDS Account Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-3 text-sm font-medium text-zinc-300">Documents Needed</h4>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                    National ID (NIDA) or Passport
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                    Taxpayer Identification Number (TIN)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                    Proof of address (utility bill or bank statement)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                    Passport-size photographs (2)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                    Minimum opening amount (varies by broker, typically TZS 50,000)
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-medium text-zinc-300">Trading Fees</h4>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center justify-between rounded-lg bg-zinc-950 p-2">
                    <span>Brokerage Commission</span>
                    <span className="text-white">1.7% (negotiable)</span>
                  </li>
                  <li className="flex items-center justify-between rounded-lg bg-zinc-950 p-2">
                    <span>CMSA Fee</span>
                    <span className="text-white">0.14%</span>
                  </li>
                  <li className="flex items-center justify-between rounded-lg bg-zinc-950 p-2">
                    <span>DSE Fee</span>
                    <span className="text-white">0.12%</span>
                  </li>
                  <li className="flex items-center justify-between rounded-lg bg-zinc-950 p-2">
                    <span>CDS Fee</span>
                    <span className="text-white">0.04%</span>
                  </li>
                  <li className="flex items-center justify-between rounded-lg bg-zinc-950 p-2">
                    <span>Fidelity Fund</span>
                    <span className="text-white">0.02%</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How Referrals Work */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">How Referrals Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 text-amber-400 font-bold">
                  1
                </div>
                <h4 className="mb-1 text-sm font-medium text-white">Get Your Link</h4>
                <p className="text-xs text-zinc-400">
                  Click &quot;Get Referral Link&quot; on any DSE broker to generate your unique code.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 text-amber-400 font-bold">
                  2
                </div>
                <h4 className="mb-1 text-sm font-medium text-white">Share & Refer</h4>
                <p className="text-xs text-zinc-400">
                  Share your referral code with friends. They use it when opening a brokerage account.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 text-amber-400 font-bold">
                  3
                </div>
                <h4 className="mb-1 text-sm font-medium text-white">Earn Commission</h4>
                <p className="text-xs text-zinc-400">
                  When your referral makes their first trade, you earn a commission credited to your account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </SubscriptionGate>
    </div>
  );
}
