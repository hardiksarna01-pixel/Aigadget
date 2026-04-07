import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { getPageData, type SeoPageData } from "@/lib/api";
import { getSeedPage, seedPages, type SeedPage } from "@/data/seed-pages";
import { trendingProducts } from "@/data/mock";
import { ProductCard } from "@/components/common/product-card";
import { ComparisonTable } from "@/components/common/comparison-table";
import { FAQAccordion } from "@/components/common/faq-accordion";
import { JsonLd } from "@/components/common/json-ld";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// ISR: Revalidate every 24 hours
export const revalidate = 86400;

// Pre-build all seed pages at build time
export async function generateStaticParams() {
  return seedPages.map((p) => ({ slug: p.slug }));
}

// ==========================================
// HELPERS
// ==========================================

function resolvePageData(apiData: SeoPageData | null, slug: string) {
  // Prefer API data if available
  if (apiData) {
    return {
      title: apiData.title,
      metaTitle: apiData.metaTitle,
      metaDescription: apiData.metaDescription,
      heading: apiData.heading,
      content: apiData.content,
      faqs: (apiData.faqContent || []) as Array<{ question: string; answer: string }>,
      products: apiData.products.map((p) => p.product),
      internalLinks: apiData.internalLinks || [],
      schemaMarkup: apiData.schemaMarkup,
    };
  }

  // Fallback to seed data for MVP (works without backend)
  const seed = getSeedPage(slug);
  if (!seed) return null;

  // Resolve product slugs to actual product data
  const products = seed.productSlugs
    .map((s) => trendingProducts.find((p) => p.slug === s))
    .filter(Boolean) as typeof trendingProducts;

  return {
    title: seed.title,
    metaTitle: seed.metaTitle,
    metaDescription: seed.metaDescription,
    heading: seed.heading,
    content: seed.content,
    faqs: seed.faqContent,
    products,
    internalLinks: seed.internalLinks,
    schemaMarkup: null,
  };
}

// ==========================================
// METADATA
// ==========================================

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const apiData = await getPageData(slug);
  const page = resolvePageData(apiData, slug);

  if (!page) {
    return { title: "Page Not Found | AIGadget" };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.heading,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.heading,
      type: "article",
      siteName: "AIGadget",
    },
    alternates: {
      canonical: `/best/${slug}`,
    },
  };
}

// ==========================================
// PAGE
// ==========================================

export default async function BestPage({ params }: PageProps) {
  const { slug } = await params;
  const apiData = await getPageData(slug);
  const page = resolvePageData(apiData, slug);

  if (!page) {
    notFound();
  }

  const { products, faqs, content, internalLinks } = page;

  return (
    <>
      {/* Structured Data */}
      {page.schemaMarkup && <JsonLd data={page.schemaMarkup} />}

      <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/category/smartphones" className="hover:text-foreground transition-colors">Smartphones</Link>
          <span>/</span>
          <span className="text-foreground">{page.title}</span>
        </nav>

        {/* H1 */}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          {page.heading}
        </h1>

        {/* Meta badges */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge variant="ai">
            <Sparkles className="mr-1 h-3 w-3" />
            AI-Analyzed
          </Badge>
          <Badge variant="secondary">
            <TrendingUp className="mr-1 h-3 w-3" />
            {products.length} Products Reviewed
          </Badge>
          <span className="text-sm text-muted-foreground">
            Updated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
        </div>

        {/* AI-generated content */}
        {content && (
          <div
            className="prose prose-zinc dark:prose-invert mt-8 max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h3:text-xl prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        {/* Top Picks Grid */}
        {products.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight">
              Top Picks
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ranked by our AI based on specs, reviews, and value
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, i) => (
                <ProductCard
                  key={product.slug || i}
                  product={product}
                  rank={i + 1}
                  showAffiliate
                />
              ))}
            </div>
          </section>
        )}

        {/* AI Verdict Box */}
        <section className="mt-12">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-purple-500/10 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h2 className="text-xl font-bold">AI Verdict</h2>
            </div>
            {products.length > 0 ? (
              <div className="space-y-3">
                <p className="text-lg font-semibold text-foreground">
                  Our #1 pick: {products[0].name}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {products[0].aiSummary}
                </p>
                {products[0].pros && products[0].pros.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {products[0].pros.slice(0, 3).map((pro, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                AI analysis is being generated. Check back soon.
              </p>
            )}
          </div>
        </section>

        {/* Comparison Table */}
        {products.length >= 2 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight mb-6">
              Specification Comparison
            </h2>
            <ComparisonTable products={products} />
          </section>
        )}

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight mb-6">
              Frequently Asked Questions
            </h2>
            <FAQAccordion faqs={faqs} />
          </section>
        )}

        {/* Internal Links */}
        {internalLinks && internalLinks.length > 0 && (
          <section className="mt-12 border-t border-border pt-8">
            <h3 className="text-lg font-semibold mb-4">Related Guides</h3>
            <div className="flex flex-wrap gap-2">
              {internalLinks.map((link) => (
                <Link
                  key={link}
                  href={`/best/${link}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {link.replace(/-/g, " ")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
