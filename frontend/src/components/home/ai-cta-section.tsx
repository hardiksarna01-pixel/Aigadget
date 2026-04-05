"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, MessageSquare, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Analysis",
    description: "Every product is analyzed by AI across hundreds of reviews and data points.",
  },
  {
    icon: Zap,
    title: "Real-Time Prices",
    description: "Prices updated every hour from Amazon, Flipkart, Walmart, and Apple Store.",
  },
  {
    icon: Shield,
    title: "Unbiased Reviews",
    description: "AI synthesizes thousands of user reviews to give you the real picture.",
  },
];

export function AICTASection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-0 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Not sure what to buy?{" "}
              <span className="gradient-text">Ask our AI.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Our AI assistant has analyzed every product, read every review, and compared
              every spec. Just ask.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card/50 p-5 text-center backdrop-blur-sm"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                  <feature.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="mt-3 text-sm font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link href="/chat">
              <Button variant="gradient" size="lg">
                <MessageSquare className="h-4 w-4" />
                Chat with AI
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/compare">
              <Button variant="outline" size="lg">
                Compare Products
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
