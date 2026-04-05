"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIScore } from "@/components/ui/ai-score";
import { PriceTag } from "@/components/ui/price-tag";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: {
    slug: string;
    name: string;
    brand: string;
    category: string;
    imageUrl?: string | null;
    aiScore?: number | null;
    aiSummary?: string | null;
    pros?: string[];
    prices: Array<{
      platform: string;
      price: number;
      originalPrice?: number | null;
      currency: string;
      url: string;
      inStock: boolean;
    }>;
  };
  rank?: number;
  showAffiliate?: boolean;
}

const platformColors: Record<string, string> = {
  amazon: "bg-[#FF9900] hover:bg-[#e88b00] text-black",
  flipkart: "bg-[#2874F0] hover:bg-[#1a5dc8] text-white",
  walmart: "bg-[#0071DC] hover:bg-[#005bb5] text-white",
  apple: "bg-[#333] hover:bg-[#1d1d1f] text-white",
};

const platformNames: Record<string, string> = {
  amazon: "Amazon",
  flipkart: "Flipkart",
  walmart: "Walmart",
  apple: "Apple Store",
};

export function ProductCard({ product, rank, showAffiliate = true }: ProductCardProps) {
  const lowestPrice = product.prices
    .filter((p) => p.inStock)
    .reduce((min, p) => (p.price < min.price ? p : min), product.prices[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: (rank || 0) * 0.06 }}
      viewport={{ once: true }}
    >
      <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Rank badge */}
        {rank !== undefined && (
          <div className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
            #{rank}
          </div>
        )}

        {/* Image area */}
        <Link href={`/product/${product.slug}`}>
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted/30 to-muted p-6">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-muted to-border" />
              </div>
            )}

            {/* AI Score */}
            {product.aiScore && (
              <div className="absolute right-3 top-3">
                <AIScore score={product.aiScore} size="sm" />
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{product.brand}</p>
              <Link href={`/product/${product.slug}`}>
                <h3 className="mt-0.5 text-sm font-semibold leading-tight line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {product.name}
                </h3>
              </Link>
            </div>
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {product.category}
            </Badge>
          </div>

          {product.aiSummary && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {product.aiSummary}
            </p>
          )}

          {/* Price */}
          <div className="mt-3">
            {lowestPrice && (
              <PriceTag
                price={lowestPrice.price}
                originalPrice={lowestPrice.originalPrice ?? undefined}
                currency={lowestPrice.currency}
                size="sm"
              />
            )}
          </div>

          {/* Affiliate buttons */}
          {showAffiliate && product.prices.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.prices
                .filter((p) => p.inStock)
                .slice(0, 3)
                .map((p) => (
                  <a
                    key={p.platform}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                      platformColors[p.platform] || "bg-muted text-foreground hover:bg-accent"
                    }`}
                  >
                    <ShoppingCart className="h-3 w-3" />
                    {platformNames[p.platform] || p.platform}
                    <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                  </a>
                ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
