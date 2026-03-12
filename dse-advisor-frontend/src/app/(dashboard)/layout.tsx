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
        <div className="ml-64">
          <Header />
          <main className="min-h-[calc(100vh-4rem)] bg-zinc-900 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
