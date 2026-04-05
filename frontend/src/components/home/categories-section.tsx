"use client";

import { motion } from "framer-motion";
import {
  Smartphone,
  Laptop,
  Tablet,
  Headphones,
  Watch,
  Camera,
  Speaker,
  Gamepad2,
  ArrowRight,
  Grid3X3,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/mock";

const iconMap: Record<string, React.ElementType> = {
  Smartphone,
  Laptop,
  Tablet,
  Headphones,
  Watch,
  Camera,
  Speaker,
  Gamepad2,
};

const gradients = [
  "from-blue-500/10 to-cyan-500/10",
  "from-violet-500/10 to-purple-500/10",
  "from-pink-500/10 to-rose-500/10",
  "from-amber-500/10 to-orange-500/10",
  "from-emerald-500/10 to-green-500/10",
  "from-red-500/10 to-pink-500/10",
  "from-indigo-500/10 to-blue-500/10",
  "from-teal-500/10 to-cyan-500/10",
];

const iconColors = [
  "text-blue-600 dark:text-blue-400",
  "text-violet-600 dark:text-violet-400",
  "text-pink-600 dark:text-pink-400",
  "text-amber-600 dark:text-amber-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-red-600 dark:text-red-400",
  "text-indigo-600 dark:text-indigo-400",
  "text-teal-600 dark:text-teal-400",
];

export function CategoriesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <Grid3X3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Browse Categories</h2>
            <p className="text-sm text-muted-foreground">Explore products by category</p>
          </div>
        </div>
      </div>

      {/* Category grid */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((category, i) => {
          const Icon = iconMap[category.icon] || Smartphone;
          return (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <Link
                href={`/category/${category.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-border/80 hover:scale-[1.02]"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradients[i]}`}
                >
                  <Icon className={`h-6 w-6 ${iconColors[i]}`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {category.productCount} products
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
