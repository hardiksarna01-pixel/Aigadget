import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AIService } from '../ai/ai.service';

export interface SearchRequest {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  limit?: number;
}

export interface SearchResult {
  products: any[];
  aiExplanation: string;
  confidence: number;
  alternatives: any[];
  followUpQuestions: string[];
  totalResults: number;
}

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  async search(request: SearchRequest): Promise<SearchResult> {
    const { query, category, minPrice, maxPrice, brands, limit = 10 } = request;

    // Step 1: AI interprets the query to extract structured intent
    const intent = await this.aiService.parseSearchIntent(query);

    // Step 2: Build database query from AI-parsed intent
    const where: any = {
      status: 'PUBLISHED',
      ...(intent.category || category ? { category: intent.category || category } : {}),
      ...(intent.brands?.length || brands?.length
        ? { brand: { in: intent.brands || brands } }
        : {}),
    };

    if (intent.minPrice || minPrice || intent.maxPrice || maxPrice) {
      where.prices = {
        some: {
          inStock: true,
          price: {
            ...(intent.minPrice || minPrice ? { gte: intent.minPrice || minPrice } : {}),
            ...(intent.maxPrice || maxPrice ? { lte: intent.maxPrice || maxPrice } : {}),
          },
        },
      };
    }

    // Step 3: Query database
    const products = await this.prisma.product.findMany({
      where,
      include: {
        prices: { where: { inStock: true }, orderBy: { price: 'asc' } },
        specs: { where: { highlight: true } },
      },
      orderBy: { aiScore: 'desc' },
      take: limit * 2, // fetch extra for AI re-ranking
    });

    // Step 4: AI re-ranks and explains results
    const aiRanking = await this.aiService.rankProducts(query, products);

    return {
      products: aiRanking.rankedProducts.slice(0, limit),
      aiExplanation: aiRanking.explanation,
      confidence: aiRanking.confidence,
      alternatives: aiRanking.rankedProducts.slice(limit, limit + 3),
      followUpQuestions: aiRanking.followUpQuestions,
      totalResults: products.length,
    };
  }

  async getPopularSearches(limit = 10): Promise<string[]> {
    // In production, this would query analytics data
    return [
      'Best phone under 30k',
      'iPhone vs Samsung 2026',
      'Best laptop for coding',
      'Noise cancelling headphones',
      'Best smartwatch for fitness',
    ].slice(0, limit);
  }

  async getAutocompleteSuggestions(prefix: string, limit = 5) {
    // Product name autocomplete
    const products = await this.prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { name: { contains: prefix, mode: 'insensitive' } },
          { brand: { contains: prefix, mode: 'insensitive' } },
          { category: { contains: prefix, mode: 'insensitive' } },
        ],
      },
      select: { name: true, slug: true, brand: true, category: true },
      take: limit,
    });

    return products;
  }
}
