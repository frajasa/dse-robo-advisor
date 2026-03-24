"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  BarChart3,
  BotMessageSquare,
  TrendingUp,
  PieChart,
  Settings,
  Building2,
  Menu,
  X,
  CreditCard,
  Calculator,
  Bell,
  GraduationCap,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Advisor", href: "/advisor", icon: BotMessageSquare },
  { label: "Simulator", href: "/simulator", icon: Calculator },
  { label: "Market", href: "/market", icon: TrendingUp },
  { label: "Stocks", href: "/stocks", icon: BarChart3 },
  { label: "Analytics", href: "/analytics", icon: PieChart },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "Learn", href: "/learn", icon: GraduationCap },
  { label: "AI Assistant", href: "/assistant", icon: MessageCircle },
  { label: "Brokers", href: "/brokers", icon: Building2 },
  { label: "Pricing", href: "/pricing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-amber-400/20 to-amber-400/5 text-amber-400 shadow-sm shadow-amber-400/10"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/5 bg-zinc-950/80 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-amber-400" />
          <span className="text-base font-bold text-white">
            DSE <span className="text-amber-400">Advisor</span>
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-out nav */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/5 bg-zinc-950/95 backdrop-blur-xl transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-white/5 px-6">
          <LineChart className="h-5 w-5 text-amber-400" />
          <span className="text-base font-bold text-white">
            DSE <span className="text-amber-400">Advisor</span>
          </span>
        </div>
        <NavLinks onClick={() => setMobileOpen(false)} />
        <div className="border-t border-white/5 p-4">
          <p className="text-xs text-zinc-600">DSE Robo-Advisor v1.0</p>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/5 bg-zinc-950/80 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/5 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600">
            <LineChart className="h-4 w-4 text-black" />
          </div>
          <span className="text-lg font-bold text-white">
            DSE <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">Advisor</span>
          </span>
        </div>
        <NavLinks />
        <div className="border-t border-white/5 p-4">
          <p className="text-xs text-zinc-600">DSE Robo-Advisor v1.0</p>
        </div>
      </aside>
    </>
  );
}
