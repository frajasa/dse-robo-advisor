"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Phone, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentProvider = "mpesa" | "tigopesa" | "airtelmoney" | null;

type PaymentStep = "select" | "enter-phone" | "processing" | "confirm-pin" | "success";

interface MobileMoneyDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planName: string;
  amount: string;
}

const PROVIDERS = [
  {
    id: "mpesa" as const,
    name: "M-Pesa",
    operator: "Vodacom",
    color: "text-red-400",
    bgColor: "bg-red-400/10 border-red-400/30 hover:border-red-400/60",
    activeColor: "bg-red-400/20 border-red-400",
    prefix: "0754",
  },
  {
    id: "tigopesa" as const,
    name: "Tigo Pesa",
    operator: "Tigo",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10 border-blue-400/30 hover:border-blue-400/60",
    activeColor: "bg-blue-400/20 border-blue-400",
    prefix: "0652",
  },
  {
    id: "airtelmoney" as const,
    name: "Airtel Money",
    operator: "Airtel",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10 border-orange-400/30 hover:border-orange-400/60",
    activeColor: "bg-orange-400/20 border-orange-400",
    prefix: "0685",
  },
];

export function MobileMoneyDialog({
  open,
  onClose,
  onSuccess,
  planName,
  amount,
}: MobileMoneyDialogProps) {
  const [step, setStep] = useState<PaymentStep>("select");
  const [provider, setProvider] = useState<PaymentProvider>(null);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [txRef, setTxRef] = useState("");

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep("select");
      setProvider(null);
      setPhone("");
      setPin("");
      setCountdown(0);
      setTxRef("");
    }
  }, [open]);

  // Processing countdown (simulates USSD push)
  useEffect(() => {
    if (step === "processing" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (step === "processing" && countdown === 0) {
      setStep("confirm-pin");
    }
  }, [step, countdown]);

  const handleSelectProvider = (p: PaymentProvider) => {
    setProvider(p);
    const prov = PROVIDERS.find((pr) => pr.id === p);
    if (prov) setPhone(prov.prefix);
    setStep("enter-phone");
  };

  const handleSubmitPhone = () => {
    if (phone.length < 10) return;
    setCountdown(5);
    setStep("processing");
  };

  const handleConfirmPin = () => {
    if (pin.length < 4) return;
    // Generate a mock transaction reference
    const ref = `TXN${Date.now().toString(36).toUpperCase()}`;
    setTxRef(ref);
    setStep("success");
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  const selectedProvider = PROVIDERS.find((p) => p.id === provider);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && step !== "processing" && onClose()}>
      <DialogContent className="border-zinc-800 bg-zinc-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {step === "success" ? "Payment Successful" : "Mobile Money Payment"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {step === "success"
              ? `Your ${planName} subscription is now active.`
              : `Pay ${amount} for ${planName} plan`}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select provider */}
        {step === "select" && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-zinc-400">Choose payment method:</p>
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectProvider(p.id)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-lg border p-4 transition-colors",
                  p.bgColor
                )}
              >
                <Phone className={cn("h-6 w-6", p.color)} />
                <div className="text-left">
                  <p className={cn("font-semibold", p.color)}>{p.name}</p>
                  <p className="text-xs text-zinc-500">{p.operator} Tanzania</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Enter phone number */}
        {step === "enter-phone" && selectedProvider && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <Phone className={cn("h-5 w-5", selectedProvider.color)} />
              <div>
                <p className={cn("text-sm font-medium", selectedProvider.color)}>
                  {selectedProvider.name}
                </p>
                <p className="text-xs text-zinc-500">{selectedProvider.operator} Tanzania</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Phone Number</Label>
              <Input
                type="tel"
                placeholder="07XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 12))}
                className="border-zinc-700 bg-zinc-800 text-white text-lg tracking-wider placeholder:text-zinc-500"
              />
              <p className="text-xs text-zinc-500">
                Enter your {selectedProvider.name} registered number
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Amount</span>
                <span className="font-semibold text-white">{amount}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-zinc-400">Plan</span>
                <span className="text-amber-400">{planName}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("select")}
                className="flex-1 border-zinc-700 text-zinc-300"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitPhone}
                disabled={phone.length < 10}
                className="flex-1 bg-amber-400 text-black hover:bg-amber-500"
              >
                Pay {amount}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Processing - simulating USSD push */}
        {step === "processing" && selectedProvider && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-amber-400" />
            <p className="mb-2 text-sm font-medium text-white">
              Sending payment request...
            </p>
            <p className="text-center text-xs text-zinc-400">
              A {selectedProvider.name} prompt will appear on{" "}
              <span className="text-white">{phone}</span>
            </p>
            <p className="mt-4 text-2xl font-bold text-amber-400">
              {countdown}s
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Check your phone for the USSD prompt
            </p>
          </div>
        )}

        {/* Step 4: Confirm PIN (mock) */}
        {step === "confirm-pin" && selectedProvider && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 rounded-lg border border-green-400/20 bg-green-400/5 p-3">
              <Shield className="h-5 w-5 text-green-400" />
              <p className="text-sm text-green-400">
                Payment request sent to {phone}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">
                Enter your {selectedProvider.name} PIN to confirm
              </Label>
              <Input
                type="password"
                placeholder="****"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                className="border-zinc-700 bg-zinc-800 text-white text-center text-2xl tracking-[0.5em] placeholder:text-zinc-500"
              />
              <p className="text-xs text-zinc-500">
                This is a demo — enter any 4+ digit PIN
              </p>
            </div>

            <Button
              onClick={handleConfirmPin}
              disabled={pin.length < 4}
              className="w-full bg-amber-400 text-black hover:bg-amber-500"
            >
              Confirm Payment
            </Button>
          </div>
        )}

        {/* Step 5: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center py-6">
            <CheckCircle2 className="mb-4 h-14 w-14 text-green-400" />
            <p className="mb-1 text-lg font-semibold text-white">
              Payment Received!
            </p>
            <p className="mb-4 text-sm text-zinc-400">
              {amount} paid via {selectedProvider?.name}
            </p>

            <div className="mb-6 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Transaction Ref</span>
                <span className="font-mono text-white">{txRef}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-zinc-400">Phone</span>
                <span className="text-white">{phone}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-zinc-400">Amount</span>
                <span className="text-white">{amount}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-zinc-400">Plan</span>
                <span className="text-amber-400">{planName}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-zinc-400">Status</span>
                <span className="text-green-400">Confirmed</span>
              </div>
            </div>

            <Button
              onClick={handleDone}
              className="w-full bg-amber-400 text-black hover:bg-amber-500"
            >
              Continue to {planName}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
