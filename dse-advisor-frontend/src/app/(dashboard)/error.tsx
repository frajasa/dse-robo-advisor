"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md border-red-500/20 bg-zinc-900">
        <CardContent className="flex flex-col items-center py-12">
          <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-lg font-semibold text-white">
            Something went wrong
          </h2>
          <p className="mb-6 text-center text-sm text-zinc-400">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          <Button
            onClick={reset}
            className="bg-amber-400 text-black hover:bg-amber-500"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
