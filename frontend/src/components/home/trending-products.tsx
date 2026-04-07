"use client";

import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/common/product-card";
import { trendingProducts } from "@/data/mock";

export function TrendingProducts() {
  // Show phones that are trending or featured, sorted by AI score
  const trending = trendingProducts
    .filter((p) => p.trending || p.featured)
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 8);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10">
            <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Trending Now</h2>
            <p className="text-sm text-muted-foreground">Most searched smartphones this week</p>
          </div>
        </div>
        <Link href="/category/smartphones">
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Product grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {trending.map((product, i) => (
          <ProductCard key={product.id} product={product} rank={i + 1} showAffiliate />
        ))}
      </div>

      <div className="mt-6 flex justify-center sm:hidden">
        <Link href="/category/smartphones">
          <Button variant="outline" size="sm">
            View all smartphones
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
