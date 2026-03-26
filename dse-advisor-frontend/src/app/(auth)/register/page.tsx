"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(nickname, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Registration failed. Please try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Glass card */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Start building your optimized DSE portfolio today
          </p>
        </div>

        {/* Privacy notice */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
          <p className="text-xs leading-relaxed text-emerald-300/90">
            <span className="font-semibold">Privacy-first:</span> We only store your nickname and password. No email, no personal data. Compliant with Tanzania PDPC data protection guidelines.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nickname field */}
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-sm font-medium text-zinc-300">
              Nickname
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="nickname"
                type="text"
                placeholder="Choose a unique nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                pattern="^[a-zA-Z0-9_]+$"
                className="h-11 border-white/[0.08] bg-white/[0.04] pl-10 text-white placeholder:text-zinc-500 focus-visible:border-amber-400/50 focus-visible:ring-amber-400/20"
              />
            </div>
            <p className="text-xs text-zinc-500">Letters, numbers, and underscores only</p>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-zinc-300">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-11 border-white/[0.08] bg-white/[0.04] pl-10 text-white placeholder:text-zinc-500 focus-visible:border-amber-400/50 focus-visible:ring-amber-400/20"
              />
            </div>
            <p className="text-xs text-zinc-500">Must be at least 8 characters</p>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="group h-11 w-full bg-gradient-to-r from-amber-400 to-amber-500 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-amber-400 hover:shadow-amber-500/40 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            )}
            Create Account
          </Button>

          {/* Terms notice */}
          <p className="text-center text-xs leading-relaxed text-zinc-500">
            By creating an account, you agree to our{" "}
            <button type="button" className="text-zinc-400 underline underline-offset-2 hover:text-zinc-300">
              Terms of Service
            </button>{" "}
            and{" "}
            <button type="button" className="text-zinc-400 underline underline-offset-2 hover:text-zinc-300">
              Privacy Policy
            </button>
          </p>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-xs text-zinc-500">or</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-amber-400 transition-colors hover:text-amber-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
