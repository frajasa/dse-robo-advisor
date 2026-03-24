"use client";

import React from "react";
import { AuthGuard } from "@/lib/auth/guard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        <Sidebar />
        <div className="lg:ml-64">
          <Header />
          <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-4 pt-18 sm:p-6 lg:pt-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
