import { HeroSearch } from "@/components/home/hero-search";
import { TrendingProducts } from "@/components/home/trending-products";
import { DealsSection } from "@/components/home/deals-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { AICTASection } from "@/components/home/ai-cta-section";

export default function Home() {
  return (
    <>
      <HeroSearch />
      <TrendingProducts />
      <CategoriesSection />
      <DealsSection />
      <AICTASection />
    </>
  );
}
