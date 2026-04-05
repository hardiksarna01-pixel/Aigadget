"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Mic,
  Camera,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { popularSearches, aiSuggestions } from "@/data/mock";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-32 lg:px-8 lg:pt-40">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-muted-foreground">Powered by AI</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              New
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 text-center"
        >
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find the perfect gadget,{" "}
            <span className="gradient-text">powered by AI</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Search by text, image, or voice. Get instant AI-powered recommendations,
            real-time prices, and honest reviews.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative mx-auto mt-10 max-w-2xl"
        >
          <div
            className={`ai-glow relative rounded-2xl border bg-card transition-all duration-300 ${
              isFocused
                ? "border-purple-500/50 shadow-lg"
                : "border-border shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3 px-5 py-3">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                placeholder="Ask anything... &quot;Best phone under 30k for gaming&quot;"
                className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
              />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  className="ml-1 shrink-0 rounded-xl"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Search
                </Button>
              </div>
            </div>

            {/* Dropdown suggestions */}
            <AnimatePresence>
              {isFocused && !query && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="p-4">
                    {/* AI Suggestions */}
                    <div className="mb-3">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-purple-500" />
                        AI Suggestions
                      </p>
                      <div className="space-y-1">
                        {aiSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setQuery(suggestion)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                          >
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                            {suggestion}
                            <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Popular Searches */}
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        Trending Searches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {popularSearches.map((search) => (
                          <button
                            key={search}
                            onClick={() => setQuery(search)}
                            className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick stats */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span>12,000+ products analyzed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse-dot" />
              <span>Real-time prices</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse-dot" />
              <span>AI-powered reviews</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
