import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AIService } from '../ai/ai.service';

@Injectable()
export class ComparisonService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  async create(productIds: string[]) {
    if (productIds.length < 2) {
      throw new Error('At least 2 products required for comparison');
    }

    // Fetch products with full data
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        specs: { orderBy: { sortOrder: 'asc' } },
        prices: { where: { inStock: true }, orderBy: { price: 'asc' } },
      },
    });

    if (products.length < 2) {
      throw new NotFoundException('One or more products not found');
    }

    // Generate AI verdict
    const verdict = await this.aiService.generateComparisonVerdict(products);

    // Create comparison
    const slug = products.map((p) => p.slug).join('-vs-');
    const title = products.map((p) => p.name).join(' vs ');

    const comparison = await this.prisma.comparison.create({
      data: {
        slug,
        title,
        aiVerdict: verdict.verdict,
        verdictDetails: verdict.verdictDetails,
        winnerId: verdict.winner,
        status: 'PUBLISHED',
        items: {
          create: products.map((p, i) => ({
            productId: p.id,
            position: i,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                specs: true,
                prices: { where: { inStock: true }, orderBy: { price: 'asc' } },
              },
            },
          },
        },
      },
    });

    return comparison;
  }

  async findBySlug(slug: string) {
    const comparison = await this.prisma.comparison.findUnique({
      where: { slug },
      include: {
        items: {
          include: {
            product: {
              include: {
                specs: { orderBy: { sortOrder: 'asc' } },
                prices: { where: { inStock: true }, orderBy: { price: 'asc' } },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!comparison) {
      throw new NotFoundException(`Comparison "${slug}" not found`);
    }

    // Increment view count
    await this.prisma.comparison.update({
      where: { id: comparison.id },
      data: { viewCount: { increment: 1 } },
    });

    return comparison;
  }

  async getPopular(limit = 10) {
    return this.prisma.comparison.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, slug: true, brand: true, imageUrl: true, aiScore: true },
            },
          },
        },
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
  }
}
