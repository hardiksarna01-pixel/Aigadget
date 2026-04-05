import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

interface SearchIntent {
  category: string | null;
  subcategory: string | null;
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  useCase: string | null;
  priorityFeatures: string[];
}

interface RankingResult {
  rankedProducts: any[];
  explanation: string;
  confidence: number;
  followUpQuestions: string[];
}

interface ProductAnalysis {
  aiScore: number;
  summary: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  verdict: string;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private claude: Anthropic;
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    this.claude = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  // ==========================================
  // PROMPT CHAIN 1: Search Intent Parsing
  // ==========================================
  async parseSearchIntent(query: string): Promise<SearchIntent> {
    try {
      const response = await this.claude.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `You are a product search intent parser. Extract structured search parameters from natural language queries about tech gadgets.

Always respond with valid JSON only, no explanation.`,
        messages: [
          {
            role: 'user',
            content: `Parse this search query into structured parameters:
"${query}"

Return JSON:
{
  "category": "smartphones" | "laptops" | "tablets" | "headphones" | "smartwatches" | "cameras" | "speakers" | "gaming" | null,
  "subcategory": string | null,
  "brands": string[],
  "minPrice": number | null,
  "maxPrice": number | null,
  "useCase": string | null,
  "priorityFeatures": string[]
}`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      return JSON.parse(text);
    } catch (error) {
      this.logger.warn(`Claude intent parsing failed, using OpenAI fallback: ${error}`);
      return this.parseSearchIntentFallback(query);
    }
  }

  private async parseSearchIntentFallback(query: string): Promise<SearchIntent> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Parse search queries about tech gadgets into structured JSON parameters.',
        },
        {
          role: 'user',
          content: `Parse: "${query}". Return JSON with: category, subcategory, brands[], minPrice, maxPrice, useCase, priorityFeatures[]`,
        },
      ],
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  // ==========================================
  // PROMPT CHAIN 2: Product Ranking
  // ==========================================
  async rankProducts(query: string, products: any[]): Promise<RankingResult> {
    if (products.length === 0) {
      return {
        rankedProducts: [],
        explanation: 'No products matched your search criteria.',
        confidence: 0,
        followUpQuestions: ['Try broadening your search', 'Would you like to explore a different category?'],
      };
    }

    const productSummaries = products.map((p, i) => ({
      index: i,
      name: p.name,
      brand: p.brand,
      aiScore: p.aiScore,
      category: p.category,
      lowestPrice: p.prices?.[0]?.price,
      keySpecs: p.specs?.map((s: any) => `${s.label}: ${s.value}`).join(', '),
    }));

    try {
      const response = await this.claude.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are an expert tech product advisor. Rank products based on user needs and explain your reasoning. Be concise and direct. Always respond with valid JSON.`,
        messages: [
          {
            role: 'user',
            content: `User query: "${query}"

Products:
${JSON.stringify(productSummaries, null, 2)}

Return JSON:
{
  "rankedIndices": [0, 2, 1, ...],
  "explanation": "brief 2-3 sentence explanation of ranking",
  "confidence": 0.0-1.0,
  "followUpQuestions": ["question1", "question2"]
}`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const result = JSON.parse(text);

      return {
        rankedProducts: result.rankedIndices.map((idx: number) => products[idx]).filter(Boolean),
        explanation: result.explanation,
        confidence: result.confidence,
        followUpQuestions: result.followUpQuestions || [],
      };
    } catch (error) {
      this.logger.warn(`AI ranking failed: ${error}`);
      return {
        rankedProducts: products.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)),
        explanation: 'Products ranked by AI score.',
        confidence: 0.5,
        followUpQuestions: [],
      };
    }
  }

  // ==========================================
  // PROMPT CHAIN 3: Product Analysis
  // ==========================================
  async analyzeProduct(productData: {
    name: string;
    brand: string;
    category: string;
    specs: any[];
    reviews: any[];
    prices: any[];
  }): Promise<ProductAnalysis> {
    const reviewSummary = productData.reviews
      .slice(0, 50)
      .map((r) => `[${r.rating}/5] ${r.title}: ${r.content?.slice(0, 200)}`)
      .join('\n');

    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are a world-class tech product reviewer. Analyze products based on specs, reviews, and market positioning. Be objective, data-driven, and concise. Respond with valid JSON only.`,
      messages: [
        {
          role: 'user',
          content: `Analyze this product:

Name: ${productData.name}
Brand: ${productData.brand}
Category: ${productData.category}

Specs:
${productData.specs.map((s) => `${s.label}: ${s.value}`).join('\n')}

Price range: ${productData.prices.map((p) => `${p.platform}: ${p.price}`).join(', ')}

User Reviews (sample):
${reviewSummary}

Return JSON:
{
  "aiScore": 0.0-10.0,
  "summary": "2-3 sentence product summary",
  "pros": ["pro1", "pro2", "pro3", "pro4"],
  "cons": ["con1", "con2", "con3"],
  "bestFor": ["use-case1", "use-case2"],
  "verdict": "one-sentence final verdict"
}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text);
  }

  // ==========================================
  // PROMPT CHAIN 4: Comparison Verdict
  // ==========================================
  async generateComparisonVerdict(products: any[]): Promise<{
    verdict: string;
    verdictDetails: Array<{ category: string; winner: string; explanation: string }>;
    winner: string;
  }> {
    const productData = products.map((p) => ({
      name: p.name,
      brand: p.brand,
      aiScore: p.aiScore,
      specs: p.specs?.map((s: any) => `${s.label}: ${s.value}`),
      lowestPrice: p.prices?.[0]?.price,
      pros: p.pros,
      cons: p.cons,
    }));

    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are an expert tech product comparator. Compare products objectively across key categories. Be decisive - always pick a winner. Respond with valid JSON only.`,
      messages: [
        {
          role: 'user',
          content: `Compare these products:
${JSON.stringify(productData, null, 2)}

Return JSON:
{
  "verdict": "2-3 sentence overall comparison verdict",
  "verdictDetails": [
    { "category": "Performance", "winner": "product name", "explanation": "why" },
    { "category": "Camera", "winner": "product name", "explanation": "why" },
    { "category": "Battery", "winner": "product name", "explanation": "why" },
    { "category": "Value for Money", "winner": "product name", "explanation": "why" },
    { "category": "Overall", "winner": "product name", "explanation": "why" }
  ],
  "winner": "overall winner product name"
}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text);
  }

  // ==========================================
  // PROMPT CHAIN 5: SEO Content Generation
  // ==========================================
  async generateSeoContent(params: {
    template: string;
    keyword: string;
    products: any[];
    category?: string;
  }): Promise<{
    title: string;
    metaTitle: string;
    metaDescription: string;
    heading: string;
    content: string;
    faqContent: Array<{ question: string; answer: string }>;
  }> {
    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: `You are an expert SEO content writer for tech products. Write content that:
1. Ranks well on Google
2. Is optimized for AI answer engines (Perplexity, ChatGPT search)
3. Includes structured data-friendly formatting
4. Is genuinely helpful to readers
5. Naturally incorporates affiliate-worthy product mentions

Write in a premium, authoritative tone. Respond with valid JSON only.`,
      messages: [
        {
          role: 'user',
          content: `Generate SEO content for:
Template: ${params.template}
Target keyword: "${params.keyword}"
Category: ${params.category || 'general'}

Top products to feature:
${params.products.map((p) => `- ${p.name} (${p.brand}) - Score: ${p.aiScore}/10 - From ₹${p.prices?.[0]?.price}`).join('\n')}

Return JSON:
{
  "title": "page title (60 chars max)",
  "metaTitle": "SEO meta title (60 chars)",
  "metaDescription": "meta description (155 chars)",
  "heading": "H1 heading",
  "content": "full HTML content with h2, h3, p, ul, ol tags (2000+ words)",
  "faqContent": [
    { "question": "FAQ question", "answer": "FAQ answer" }
  ]
}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text);
  }

  // ==========================================
  // Chat: Conversational AI
  // ==========================================
  async chat(
    messages: Array<{ role: string; content: string }>,
    context?: { products?: any[] },
  ): Promise<{ response: string; productCards?: any[]; followUp?: string[] }> {
    const systemPrompt = `You are AIGadget's product advisor. You help users find the perfect tech products.

Rules:
- Be concise and direct
- When recommending products, include specific model names and approximate prices
- When you mention a product, wrap it in [[product:slug]] notation so the frontend can render product cards
- Always suggest 2-3 follow-up questions
- Never make up specs or prices - if unsure, say so
- Format responses in clean markdown

${context?.products ? `Available products context:\n${JSON.stringify(context.products.slice(0, 5))}` : ''}`;

    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract product slugs from [[product:slug]] notation
    const productSlugs = [...text.matchAll(/\[\[product:([^\]]+)\]\]/g)].map((m) => m[1]);

    return {
      response: text.replace(/\[\[product:[^\]]+\]\]/g, ''), // clean for display
      productCards: productSlugs.length > 0 ? productSlugs : undefined,
      followUp: ['What features matter most to you?', 'Want me to compare specific models?'],
    };
  }
}
