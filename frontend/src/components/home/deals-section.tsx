"use client";

import { motion } from "framer-motion";
import { Zap, Clock, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIScore } from "@/components/ui/ai-score";
import { PriceTag } from "@/components/ui/price-tag";
import { Button } from "@/components/ui/button";
import { dealProducts } from "@/data/mock";
import { DealProduct } from "@/types/product";

function DealCard({ deal, index }: { deal: DealProduct; index: number }) {
  const lowestPrice = deal.prices.reduce(
    (min, p) => (p.price < min.price ? p : min),
    deal.prices[0]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="group relative overflow-hidden hover:shadow-lg transition-all">
        {/* Discount ribbon */}
        <div className="absolute left-0 top-4 z-10 rounded-r-full bg-gradient-to-r from-red-500 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-md">
          {deal.discount}% OFF
        </div>

        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted p-6 sm:w-48 sm:shrink-0">
            <div className="flex h-full items-center justify-center">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-muted to-border" />
            </div>
            <div className="absolute right-3 top-3">
              <AIScore score={deal.aiScore} size="sm" />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between p-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{deal.brand}</p>
                  <h3 className="mt-0.5 text-base font-semibold">{deal.name}</h3>
                </div>
                <Badge variant="warning" className="shrink-0">
                  <Clock className="mr-1 h-3 w-3" />
                  Limited
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {deal.aiSummary}
              </p>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <PriceTag
                price={lowestPrice.price}
                originalPrice={lowestPrice.originalPrice}
                size="md"
              />
              <Button variant="default" size="sm">
                View Deal
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function DealsSection() {
  return (
    <section className="bg-gradient-to-b from-transparent via-orange-500/[0.03] to-transparent">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10">
              <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Today&apos;s Best Deals</h2>
              <p className="text-sm text-muted-foreground">AI-curated deals updated in real-time</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            All deals
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Deals list */}
        <div className="mt-8 space-y-4">
          {dealProducts.map((deal, i) => (
            <DealCard key={deal.id} deal={deal} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
