#!/usr/bin/env ts-node
/**
 * 10K Keyword Generator for AIGadget Programmatic SEO
 *
 * Generates 10,000 unique SEO keywords using the formula:
 *   "Best {category} under {price} for {use_case} in {location}"
 *
 * Usage:
 *   npx ts-node scripts/generate-keywords.ts > keywords.csv
 *   npx ts-node scripts/generate-keywords.ts --count 5000
 *   npx ts-node scripts/generate-keywords.ts --format json > keywords.json
 */

// ==========================================
// EXPANDED KEYWORD VARIABLES
// ==========================================

const CATEGORIES = [
  'smartphone', 'laptop', 'earbuds', 'smartwatch',
  'tablet', 'gaming phone', 'camera phone', 'ultrabook',
  'gaming laptop', 'budget phone', 'flagship phone',
  'bluetooth speaker', 'headphones', 'monitor',
  'keyboard', 'mouse', 'smart tv', 'fitness band',
  'power bank', 'charger',
];

const PRICE_BUCKETS = [
  { value: 5000,   label: '5000',   shortLabel: '5k' },
  { value: 10000,  label: '10000',  shortLabel: '10k' },
  { value: 15000,  label: '15000',  shortLabel: '15k' },
  { value: 20000,  label: '20000',  shortLabel: '20k' },
  { value: 25000,  label: '25000',  shortLabel: '25k' },
  { value: 30000,  label: '30000',  shortLabel: '30k' },
  { value: 40000,  label: '40000',  shortLabel: '40k' },
  { value: 50000,  label: '50000',  shortLabel: '50k' },
  { value: 60000,  label: '60000',  shortLabel: '60k' },
  { value: 80000,  label: '80000',  shortLabel: '80k' },
  { value: 100000, label: '100000', shortLabel: '1 lakh' },
  { value: 150000, label: '150000', shortLabel: '1.5 lakh' },
  { value: 200000, label: '200000', shortLabel: '2 lakh' },
];

const USE_CASES = [
  'gaming', 'students', 'coding', 'video editing',
  'photography', 'vlogging', 'travel', 'office work',
  'business', 'multitasking', 'battery life', 'camera',
  'content creators', 'streaming', 'online classes',
  'zoom calls', 'gaming + streaming', 'heavy usage',
  'lightweight usage', 'durability', 'outdoor use',
  'gym', 'music', 'movies', 'budget buyers',
  'premium users', 'beginners', 'professionals',
  'kids', 'seniors',
];

const LOCATIONS = ['India', 'USA', 'UK'];

// ==========================================
// KEYWORD GENERATION
// ==========================================

interface Keyword {
  keyword: string;
  slug: string;
  category: string;
  price: string;
  use_case: string;
  location: string;
  template: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function generateAllKeywords(): Keyword[] {
  const keywords: Keyword[] = [];

  // TYPE 1: "Best {category} under {price}" (260 keywords)
  for (const cat of CATEGORIES) {
    for (const price of PRICE_BUCKETS) {
      keywords.push({
        keyword: `Best ${cat} under ${price.label}`,
        slug: `best-${slugify(cat)}-under-${price.shortLabel.replace(/\s/g, '-')}`,
        category: cat,
        price: price.label,
        use_case: '',
        location: '',
        template: 'best-under-price',
      });
    }
  }

  // TYPE 2: "Best {category} for {use_case}" (600 keywords)
  for (const cat of CATEGORIES) {
    for (const uc of USE_CASES) {
      keywords.push({
        keyword: `Best ${cat} for ${uc}`,
        slug: `best-${slugify(cat)}-for-${slugify(uc)}`,
        category: cat,
        price: '',
        use_case: uc,
        location: '',
        template: 'best-for-usecase',
      });
    }
  }

  // TYPE 3: "Best {category} under {price} for {use_case}" (7,800 keywords)
  for (const cat of CATEGORIES) {
    for (const price of PRICE_BUCKETS) {
      for (const uc of USE_CASES) {
        keywords.push({
          keyword: `Best ${cat} under ${price.label} for ${uc}`,
          slug: `best-${slugify(cat)}-under-${price.shortLabel.replace(/\s/g, '-')}-for-${slugify(uc)}`,
          category: cat,
          price: price.label,
          use_case: uc,
          location: '',
          template: 'best-for-usecase-price',
        });
      }
    }
  }

  // TYPE 4: "Best {category} under {price} for {use_case} in {location}" (23,400 keywords)
  for (const cat of CATEGORIES) {
    for (const price of PRICE_BUCKETS) {
      for (const uc of USE_CASES) {
        for (const loc of LOCATIONS) {
          keywords.push({
            keyword: `Best ${cat} under ${price.label} for ${uc} in ${loc}`,
            slug: `best-${slugify(cat)}-under-${price.shortLabel.replace(/\s/g, '-')}-for-${slugify(uc)}-in-${slugify(loc)}`,
            category: cat,
            price: price.label,
            use_case: uc,
            location: loc,
            template: 'best-for-usecase-price-location',
          });
        }
      }
    }
  }

  // TYPE 5: "Best {category} for {use_case} in {location}" (1,800 keywords)
  for (const cat of CATEGORIES) {
    for (const uc of USE_CASES) {
      for (const loc of LOCATIONS) {
        keywords.push({
          keyword: `Best ${cat} for ${uc} in ${loc}`,
          slug: `best-${slugify(cat)}-for-${slugify(uc)}-in-${slugify(loc)}`,
          category: cat,
          price: '',
          use_case: uc,
          location: loc,
          template: 'best-for-usecase-location',
        });
      }
    }
  }

  // TYPE 6: "Best {category} under {price} in {location}" (780 keywords)
  for (const cat of CATEGORIES) {
    for (const price of PRICE_BUCKETS) {
      for (const loc of LOCATIONS) {
        keywords.push({
          keyword: `Best ${cat} under ${price.label} in ${loc}`,
          slug: `best-${slugify(cat)}-under-${price.shortLabel.replace(/\s/g, '-')}-in-${slugify(loc)}`,
          category: cat,
          price: price.label,
          use_case: '',
          location: loc,
          template: 'best-under-price-location',
        });
      }
    }
  }

  return keywords;
}

/**
 * Deterministic sampling to get exactly N keywords with even distribution
 */
function sampleKeywords(keywords: Keyword[], count: number): Keyword[] {
  if (keywords.length <= count) return keywords;

  // Shuffle deterministically using Fisher-Yates with a seed
  const shuffled = [...keywords];
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

// ==========================================
// OUTPUT
// ==========================================

function toCSV(keywords: Keyword[]): string {
  const header = 'keyword,slug,category,price,use_case,location,template';
  const rows = keywords.map((k) =>
    [
      `"${k.keyword}"`,
      k.slug,
      k.category,
      k.price,
      `"${k.use_case}"`,
      k.location,
      k.template,
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

function toJSON(keywords: Keyword[]): string {
  return JSON.stringify(keywords, null, 2);
}

// ==========================================
// MAIN
// ==========================================

function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args.find((a, i) => args[i - 1] === '--count') || '10000', 10);
  const format = args.find((a, i) => args[i - 1] === '--format') || 'csv';

  const allKeywords = generateAllKeywords();

  console.error(`Total possible keywords: ${allKeywords.length.toLocaleString()}`);
  console.error(`Sampling ${count.toLocaleString()} keywords...`);

  const sampled = sampleKeywords(allKeywords, count);

  // Stats
  const byTemplate: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const k of sampled) {
    byTemplate[k.template] = (byTemplate[k.template] || 0) + 1;
    byCategory[k.category] = (byCategory[k.category] || 0) + 1;
  }

  console.error(`\nDistribution by template:`);
  for (const [t, c] of Object.entries(byTemplate).sort((a, b) => b[1] - a[1])) {
    console.error(`  ${t}: ${c}`);
  }

  console.error(`\nDistribution by category:`);
  for (const [cat, c] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.error(`  ${cat}: ${c}`);
  }

  // Output
  if (format === 'json') {
    console.log(toJSON(sampled));
  } else {
    console.log(toCSV(sampled));
  }

  console.error(`\nDone! ${sampled.length.toLocaleString()} keywords generated.`);
}

main();
