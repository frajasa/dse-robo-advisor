"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Invalid email or password");
      } else {
        setError("Invalid email or password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-white">Sign In</CardTitle>
        <CardDescription className="text-zinc-400">
          Enter your credentials to access your portfolio
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full bg-amber-400 text-black hover:bg-amber-500"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          <p className="text-center text-sm text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-amber-400 hover:text-amber-300"
            >
              Register
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
