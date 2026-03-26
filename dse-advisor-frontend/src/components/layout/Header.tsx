"use client";

import React from "react";
import { useAuth } from "@/lib/auth/context";
import { useQuery } from "@apollo/client/react";
import { ME_QUERY } from "@/lib/graphql/queries";
import { Button } from "@/components/ui/button";
import { LogOut, User, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, logout } = useAuth();
  const { data } = useQuery(ME_QUERY);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tier = (data as Record<string, any>)?.me?.subscription?.tier || "FREE";

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center justify-end border-b border-white/5 bg-zinc-950/80 px-4 backdrop-blur-xl sm:px-6 lg:flex">

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "hidden rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider sm:inline-flex",
            tier === "FREE" && "bg-zinc-800 text-zinc-400",
            tier === "PREMIUM" && "bg-amber-400/15 text-amber-400",
            tier === "ENTERPRISE" && "bg-purple-400/15 text-purple-400"
          )}
        >
          {tier === "PREMIUM" && <Crown className="mr-1 h-3 w-3" />}
          {tier}
        </span>

        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
            <User className="h-4 w-4 text-zinc-400" />
          </div>
          <span className="max-w-[120px] truncate text-sm text-zinc-300">
            {user?.nickname}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
