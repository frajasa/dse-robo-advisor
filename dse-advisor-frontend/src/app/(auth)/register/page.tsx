"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, User, Phone, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(email, password, fullName, phone);
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

        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name field */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-zinc-300">
              Full Name
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11 border-white/[0.08] bg-white/[0.04] pl-10 text-white placeholder:text-zinc-500 focus-visible:border-amber-400/50 focus-visible:ring-amber-400/20"
              />
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-zinc-300">
              Email address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-white/[0.08] bg-white/[0.04] pl-10 text-white placeholder:text-zinc-500 focus-visible:border-amber-400/50 focus-visible:ring-amber-400/20"
              />
            </div>
          </div>

          {/* Phone field */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-zinc-300">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="phone"
                type="tel"
                placeholder="+255 7XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
