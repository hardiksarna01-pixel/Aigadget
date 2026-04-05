import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { getPageData, type SeoPageData } from "@/lib/api";
import { ProductCard } from "@/components/common/product-card";
import { ComparisonTable } from "@/components/common/comparison-table";
import { FAQAccordion } from "@/components/common/faq-accordion";
import { JsonLd } from "@/components/common/json-ld";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// ISR: Revalidate every 24 hours
export const revalidate = 86400;

// ==========================================
// METADATA
// ==========================================

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPageData(slug);

  if (!data) {
    return { title: "Page Not Found | AIGadget" };
  }

  return {
    title: data.metaTitle || data.title,
    description: data.metaDescription || data.heading,
    openGraph: {
      title: data.metaTitle || data.title,
      description: data.metaDescription || data.heading,
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
  const data = await getPageData(slug);

  if (!data) {
    notFound();
  }

  const products = data.products.map((p) => p.product);
  const faqs = (data.faqContent || []) as Array<{ question: string; answer: string }>;

  return (
    <>
      {/* Structured Data */}
      {data.schemaMarkup && <JsonLd data={data.schemaMarkup} />}

      <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/best" className="hover:text-foreground transition-colors">Best Picks</Link>
          <span>/</span>
          <span className="text-foreground">{data.title}</span>
        </nav>

        {/* H1 */}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          {data.heading}
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

        {/* Intro / AI-generated content */}
        {data.content && (
          <div
            className="prose prose-zinc dark:prose-invert mt-8 max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h3:text-xl prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-table:border prose-td:border prose-td:px-3 prose-td:py-2 prose-th:border prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2"
            dangerouslySetInnerHTML={{ __html: data.content }}
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
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
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
            {products.length > 0 && products[0].aiSummary ? (
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
                AI analysis is being generated for this category. Check back soon.
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
        {data.internalLinks && data.internalLinks.length > 0 && (
          <section className="mt-12 border-t border-border pt-8">
            <h3 className="text-lg font-semibold mb-4">Related Guides</h3>
            <div className="flex flex-wrap gap-2">
              {data.internalLinks.map((link) => (
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
