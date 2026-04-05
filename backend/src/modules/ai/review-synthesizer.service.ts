import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '@/database/prisma.service';

interface ReviewSynthesis {
  overallScore: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  commonPraises: string[];
  commonComplaints: string[];
  hiddenInsights: string[];
  summary: string;
}

@Injectable()
export class ReviewSynthesizer {
  private readonly logger = new Logger(ReviewSynthesizer.name);
  private claude: Anthropic;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.claude = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async synthesizeReviews(productId: string): Promise<ReviewSynthesis> {
    // Fetch all reviews for product
    const reviews = await this.prisma.productReview.findMany({
      where: { productId },
      orderBy: { helpful: 'desc' },
      take: 200, // Top 200 most helpful reviews
    });

    if (reviews.length === 0) {
      return {
        overallScore: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        commonPraises: [],
        commonComplaints: [],
        hiddenInsights: [],
        summary: 'No reviews available yet.',
      };
    }

    // Batch reviews into chunks for processing
    const reviewTexts = reviews
      .map((r) => `[${r.rating}/5${r.verifiedPurchase ? ' VERIFIED' : ''}] ${r.title || ''}: ${r.content?.slice(0, 300) || 'No content'}`)
      .join('\n---\n');

    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are a review analysis expert. Synthesize product reviews into actionable insights. Focus on patterns, not individual opinions. Identify things that marketing won't tell you. Respond with valid JSON only.`,
      messages: [
        {
          role: 'user',
          content: `Analyze these ${reviews.length} product reviews:

${reviewTexts}

Return JSON:
{
  "overallScore": 0.0-5.0,
  "sentimentBreakdown": { "positive": 0-100, "neutral": 0-100, "negative": 0-100 },
  "commonPraises": ["top 5 things users love"],
  "commonComplaints": ["top 5 things users complain about"],
  "hiddenInsights": ["3-5 non-obvious insights from reviews that most people miss"],
  "summary": "2-3 sentence honest summary of what real users think"
}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const synthesis = JSON.parse(text);

    // Update individual review sentiments based on AI analysis
    this.logger.log(`Synthesized ${reviews.length} reviews for product ${productId}`);

    return synthesis;
  }

  async batchSynthesizeAllProducts(): Promise<void> {
    const products = await this.prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, name: true },
    });

    this.logger.log(`Starting batch review synthesis for ${products.length} products`);

    for (const product of products) {
      try {
        await this.synthesizeReviews(product.id);
        this.logger.log(`Synthesized reviews for: ${product.name}`);
      } catch (error) {
        this.logger.error(`Failed to synthesize reviews for ${product.name}: ${error}`);
      }
    }
  }
}
