"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LineChart, BarChart3, BotMessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Advisor",
    href: "/advisor",
    icon: BotMessageSquare,
  },
  {
    label: "Stocks",
    href: "/stocks",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
        <LineChart className="h-6 w-6 text-amber-400" />
        <span className="text-lg font-bold text-white">
          DSE <span className="text-amber-400">Advisor</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-amber-400/10 text-amber-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <p className="text-xs text-zinc-500">DSE Robo-Advisor v1.0</p>
      </div>
    </aside>
  );
}
