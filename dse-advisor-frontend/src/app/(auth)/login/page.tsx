"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(nickname, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Invalid nickname or password");
      } else {
        setError("Invalid nickname or password");
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
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to access your portfolio and market insights
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
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="h-11 border-white/[0.08] bg-white/[0.04] pl-10 text-white placeholder:text-zinc-500 focus-visible:border-amber-400/50 focus-visible:ring-amber-400/20"
              />
            </div>
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 border-white/[0.08] bg-white/[0.04] pl-10 text-white placeholder:text-zinc-500 focus-visible:border-amber-400/50 focus-visible:ring-amber-400/20"
              />
            </div>
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
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-xs text-zinc-500">or</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-amber-400 transition-colors hover:text-amber-300"
          >
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
}
