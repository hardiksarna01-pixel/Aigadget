import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Filter, ArrowUpDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/common/product-card";
import { trendingProducts, categories } from "@/data/mock";
import { formatPrice } from "@/lib/utils";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);

  if (!category) return { title: "Category Not Found | AIGadget" };

  return {
    title: `Best ${category.name} in India 2026 - AI Reviews & Prices | AIGadget`,
    description: `Discover the best ${category.name.toLowerCase()} in India with AI-powered reviews, real-time price comparison, and honest analysis. Updated April 2026.`,
    openGraph: {
      title: `Best ${category.name} in India 2026 | AIGadget`,
      description: `AI-curated ${category.name.toLowerCase()} with price comparison across Amazon & Flipkart.`,
    },
    alternates: { canonical: `/category/${slug}` },
  };
}

export async function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);

  if (!category) notFound();

  const products = trendingProducts
    .filter((p) => p.category === slug)
    .sort((a, b) => b.aiScore - a.aiScore);

  const lowestPrice = products.length > 0
    ? Math.min(...products.flatMap((p) => p.prices.filter((pr) => pr.inStock).map((pr) => pr.price)))
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground capitalize">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Best {category.name} in India 2026
          </h1>
          <p className="mt-2 text-muted-foreground">
            AI-analyzed and ranked. Updated daily with real-time prices.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Badge variant="ai">
          <Sparkles className="mr-1 h-3 w-3" />
          {products.length} Products Analyzed
        </Badge>
        {lowestPrice > 0 && (
          <Badge variant="secondary">
            Prices from {formatPrice(lowestPrice)}
          </Badge>
        )}
        <Badge variant="secondary">
          <Filter className="mr-1 h-3 w-3" />
          Amazon + Flipkart
        </Badge>
        <Badge variant="success">
          <ArrowUpDown className="mr-1 h-3 w-3" />
          Sorted by AI Score
        </Badge>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="mt-8 grid gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              rank={i + 1}
              showAffiliate
            />
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground">
            No products found in this category yet.
          </p>
        </div>
      )}

      {/* SEO Content */}
      <section className="mt-16 max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight">
          How We Rank {category.name}
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Our AI engine analyzes every product across specifications, user reviews from Amazon and Flipkart,
          expert opinions, and real-world performance data. Each product receives an AI Score out of 10,
          factoring in value for money, build quality, performance, and user satisfaction. Prices are
          updated hourly to ensure you always see the best deals.
        </p>
      </section>
    </div>
  );
}
