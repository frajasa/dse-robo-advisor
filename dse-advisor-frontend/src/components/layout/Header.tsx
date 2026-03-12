"use client";

import React from "react";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-sm">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/10">
            <User className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-zinc-300">{user?.fullName || "User"}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-zinc-400 hover:text-white"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
