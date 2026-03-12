import { LineChart } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <LineChart className="h-8 w-8 text-amber-400" />
        <span className="text-xl font-bold text-white">
          DSE <span className="text-amber-400">Robo-Advisor</span>
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
