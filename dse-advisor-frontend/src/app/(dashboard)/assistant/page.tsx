"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { ASK_ADVISOR_QUERY } from "@/lib/graphql/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Loader2,
  Bot,
  User,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
// Simple markdown-like rendering for AI responses
function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5 text-sm">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Bold text: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={j} className="font-semibold text-amber-400">{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        });
        // List items
        if (line.trim().startsWith("- ") || line.trim().match(/^\d+\./)) {
          return <div key={i} className="ml-3 flex gap-2"><span className="text-zinc-500">{line.trim().match(/^[-\d.]+/)?.[0]}</span><span>{rendered}</span></div>;
        }
        return <p key={i}>{rendered}</p>;
      })}
    </div>
  );
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  relatedPages?: string[];
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "Should I invest more this month?",
  "Why did my portfolio drop?",
  "How do dividends work on the DSE?",
  "When should I rebalance?",
  "What does my risk profile mean?",
  "How do I start investing?",
];

const PAGE_LABELS: Record<string, string> = {
  "/simulator": "Investment Simulator",
  "/advisor": "Portfolio Advisor",
  "/analytics": "Analytics",
  "/alerts": "Alerts & Rebalancing",
  "/learn": "Learn",
  "/onboarding": "Risk Assessment",
  "/brokers": "Brokers",
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content:
        "Hello! I'm your DSE investment advisor. Ask me anything about your portfolio, the DSE market, dividends, risk management, or how to get started investing.\n\nHere are some things you can ask me:",
      relatedPages: [],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [askAdvisor, { loading }] = useLazyQuery(ASK_ADVISOR_QUERY, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const { data } = await askAdvisor({ variables: { question } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = (data as Record<string, any>)?.askAdvisor;
      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response?.answer || "I'm sorry, I couldn't process that. Please try again.",
        relatedPages: response?.relatedPages || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSuggestedQuestion = (q: string) => {
    setInput(q);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
        <p className="text-sm text-zinc-400">
          Ask questions about your investments, the DSE, or financial concepts
        </p>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 overflow-hidden border-zinc-800 bg-zinc-900">
        <CardContent className="flex h-full flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
                    <Bot className="h-4 w-4 text-amber-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-amber-400 text-black"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <SimpleMarkdown content={msg.content} />
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}

                  {/* Related Pages */}
                  {msg.relatedPages && msg.relatedPages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-700 pt-2">
                      {msg.relatedPages.map((page) => (
                        <Link
                          key={page}
                          href={page}
                          className="flex items-center gap-1 rounded-full bg-zinc-700/50 px-3 py-1 text-xs text-amber-400 hover:bg-zinc-600/50"
                        >
                          {PAGE_LABELS[page] || page}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700">
                    <User className="h-4 w-4 text-zinc-300" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
                  <Bot className="h-4 w-4 text-amber-400" />
                </div>
                <div className="rounded-2xl bg-zinc-800 px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions (shown when few messages) */}
          {messages.length <= 1 && (
            <div className="border-t border-zinc-800 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                <Lightbulb className="h-3 w-3" />
                Suggested questions
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-amber-400/30 hover:text-amber-400"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-zinc-800 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your investments..."
                className="flex-1 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-amber-400 text-black hover:bg-amber-500"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
