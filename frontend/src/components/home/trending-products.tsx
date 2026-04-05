"use client";

import { motion } from "framer-motion";
import { TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIScore } from "@/components/ui/ai-score";
import { PriceTag } from "@/components/ui/price-tag";
import { Button } from "@/components/ui/button";
import { trendingProducts } from "@/data/mock";
import { Product } from "@/types/product";

function ProductCard({ product, index }: { product: Product; index: number }) {
  const lowestPrice = product.prices.reduce(
    (min, p) => (p.price < min.price ? p : min),
    product.prices[0]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      viewport={{ once: true }}
    >
      <Link href={`/product/${product.slug}`}>
        <Card className="group relative overflow-hidden hover:shadow-lg hover:border-border/80 cursor-pointer">
          {/* Image area */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted p-6">
            {/* Placeholder for product image */}
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-2 h-24 w-24 rounded-2xl bg-gradient-to-br from-muted to-border sm:h-32 sm:w-32" />
                <span className="text-xs text-muted-foreground">{product.brand}</span>
              </div>
            </div>

            {/* AI Score badge */}
            <div className="absolute right-3 top-3">
              <AIScore score={product.aiScore} size="sm" />
            </div>

            {/* Category badge */}
            <div className="absolute left-3 top-3">
              <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                {product.category}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground">{product.brand}</p>
            <h3 className="mt-0.5 text-sm font-semibold text-foreground line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {product.name}
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
              {product.aiSummary}
            </p>

            <div className="mt-3 flex items-center justify-between">
              <PriceTag
                price={lowestPrice.price}
                originalPrice={lowestPrice.originalPrice}
                size="sm"
              />
              <span className="text-xs text-muted-foreground">
                {product.prices.length} stores
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function TrendingProducts() {
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
            <p className="text-sm text-muted-foreground">Most searched products this week</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="hidden sm:flex">
          View all
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Product grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {trendingProducts.slice(0, 4).map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {/* Second row */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {trendingProducts.slice(4).map((product, i) => (
          <ProductCard key={product.id} product={product} index={i + 4} />
        ))}
      </div>

      <div className="mt-6 flex justify-center sm:hidden">
        <Button variant="outline" size="sm">
          View all trending
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
