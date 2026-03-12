import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloWrapper } from "@/lib/apollo/wrapper";
import { AuthProvider } from "@/lib/auth/context";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DSE Robo-Advisor",
  description:
    "AI-powered portfolio optimization for the Dar es Salaam Stock Exchange",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 antialiased`}>
        <ApolloWrapper>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
