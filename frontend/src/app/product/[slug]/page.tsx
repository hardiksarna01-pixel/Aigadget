import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ExternalLink,
  ShoppingCart,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { getProduct, type ApiProduct } from "@/lib/api";
import { AIScore } from "@/components/ui/ai-score";
import { PriceTag } from "@/components/ui/price-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/common/json-ld";

// ISR: Revalidate every 24 hours
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Product Not Found | AIGadget" };
  }

  return {
    title: `${product.name} Review & Price | AIGadget`,
    description: product.aiSummary || `${product.name} by ${product.brand} - AI-powered review, specs, and best prices.`,
    openGraph: {
      title: `${product.name} Review | AIGadget`,
      description: product.aiSummary || `${product.name} review with AI analysis.`,
      type: "article",
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
    alternates: {
      canonical: `/product/${slug}`,
    },
  };
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

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const lowestPrice = product.prices
    .filter((p) => p.inStock)
    .sort((a, b) => a.price - b.price)[0];

  // Group specs
  const specGroups = new Map<string, typeof product.specs>();
  for (const spec of product.specs) {
    const group = spec.groupName || "General";
    if (!specGroups.has(group)) specGroups.set(group, []);
    specGroups.get(group)!.push(spec);
  }

  // Schema.org Product markup
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    description: product.aiSummary,
    image: product.imageUrl,
    review: {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: product.aiScore,
        bestRating: 10,
      },
      author: { "@type": "Organization", name: "AIGadget" },
    },
    offers: product.prices
      .filter((p) => p.inStock)
      .map((p) => ({
        "@type": "Offer",
        price: p.price,
        priceCurrency: p.currency,
        url: p.url,
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: platformNames[p.platform] || p.platform },
      })),
  };

  return (
    <>
      <JsonLd data={productSchema} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/category/${product.category}`} className="hover:text-foreground transition-colors capitalize">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Hero section */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-muted/30 to-muted p-8">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-48 w-48 rounded-3xl bg-gradient-to-br from-muted to-border" />
              </div>
            )}

            {/* Tags */}
            <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
              {product.featured && <Badge variant="ai">Featured</Badge>}
              {product.trending && <Badge variant="warning">Trending</Badge>}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground">{product.brand}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {product.name}
            </h1>

            {/* AI Score */}
            {product.aiScore && (
              <div className="mt-4">
                <AIScore score={product.aiScore} size="lg" showLabel />
              </div>
            )}

            {/* AI Summary */}
            {product.aiSummary && (
              <div className="mt-5 rounded-xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-purple-500/10 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-semibold">AI Summary</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.aiSummary}
                </p>
              </div>
            )}

            {/* Price */}
            {lowestPrice && (
              <div className="mt-6">
                <PriceTag
                  price={lowestPrice.price}
                  originalPrice={lowestPrice.originalPrice ?? undefined}
                  currency={lowestPrice.currency}
                  size="lg"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Best price on {platformNames[lowestPrice.platform] || lowestPrice.platform}
                </p>
              </div>
            )}

            {/* Affiliate Buttons (Sticky on mobile) */}
            <div className="mt-6 flex flex-wrap gap-2">
              {product.prices
                .filter((p) => p.inStock)
                .sort((a, b) => a.price - b.price)
                .map((p) => (
                  <a
                    key={p.platform}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm ${
                      platformColors[p.platform] || "bg-primary text-primary-foreground"
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Buy on {platformNames[p.platform] || p.platform}
                    <span className="opacity-75">•</span>
                    <span>₹{p.price.toLocaleString("en-IN")}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                ))}
            </div>
          </div>
        </div>

        {/* Pros & Cons */}
        {(product.pros.length > 0 || product.cons.length > 0) && (
          <section className="mt-12 grid gap-6 sm:grid-cols-2">
            {product.pros.length > 0 && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  <ThumbsUp className="h-5 w-5" />
                  Pros
                </h2>
                <ul className="mt-4 space-y-2">
                  {product.pros.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.cons.length > 0 && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-red-700 dark:text-red-400">
                  <ThumbsDown className="h-5 w-5" />
                  Cons
                </h2>
                <ul className="mt-4 space-y-2">
                  {product.cons.map((con, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Specs Table */}
        {specGroups.size > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight mb-6">Specifications</h2>
            <div className="overflow-hidden rounded-2xl border border-border">
              {[...specGroups.entries()].map(([group, specs]) => (
                <div key={group}>
                  <div className="bg-muted/50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    {group}
                  </div>
                  {specs.map((spec, i) => (
                    <div
                      key={spec.label}
                      className={`flex items-center justify-between px-5 py-3 text-sm ${
                        i < specs.length - 1 ? "border-b border-border" : ""
                      } ${spec.highlight ? "bg-purple-500/5" : ""}`}
                    >
                      <span className="text-muted-foreground">{spec.label}</span>
                      <span className={`font-medium ${spec.highlight ? "text-purple-600 dark:text-purple-400 font-semibold" : ""}`}>
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Price Comparison */}
        {product.prices.length > 1 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight mb-6">Price Comparison</h2>
            <div className="space-y-3">
              {product.prices
                .sort((a, b) => a.price - b.price)
                .map((p) => (
                  <div
                    key={p.platform}
                    className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs font-bold uppercase">
                        {p.platform.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{platformNames[p.platform] || p.platform}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.inStock ? "In Stock" : "Out of Stock"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <PriceTag
                        price={p.price}
                        originalPrice={p.originalPrice ?? undefined}
                        currency={p.currency}
                        size="md"
                      />
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                      >
                        <Button size="sm" variant={p.inStock ? "default" : "secondary"} disabled={!p.inStock}>
                          {p.inStock ? "Buy Now" : "Unavailable"}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
