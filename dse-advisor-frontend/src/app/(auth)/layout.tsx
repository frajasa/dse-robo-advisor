"use client";

import { LineChart, TrendingUp, BarChart3, PieChart } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-8">
      {/* Gradient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-amber-500/20 blur-[128px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-600/15 blur-[128px]" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-[100px]" />
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating accent icons (decorative) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <TrendingUp className="absolute left-[10%] top-[15%] h-8 w-8 text-amber-400/10 rotate-12" />
        <BarChart3 className="absolute right-[12%] top-[20%] h-10 w-10 text-amber-400/[0.07] -rotate-6" />
        <PieChart className="absolute bottom-[18%] left-[15%] h-9 w-9 text-amber-400/[0.08] rotate-45" />
        <LineChart className="absolute bottom-[22%] right-[10%] h-7 w-7 text-amber-400/10 -rotate-12" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Logo / Branding */}
        <Link href="/" className="group mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25 transition-shadow group-hover:shadow-amber-500/40">
            <LineChart className="h-6 w-6 text-zinc-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-tight text-white tracking-tight">
              DSE{" "}
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
                Robo-Advisor
              </span>
            </span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              Smart Portfolio Management
            </span>
          </div>
        </Link>

        {/* Page content (login / register card) */}
        {children}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-zinc-600">
          Dar es Salaam Stock Exchange &middot; Secure &amp; Encrypted
        </p>
      </div>
    </div>
  );
}
