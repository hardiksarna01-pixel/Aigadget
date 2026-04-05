import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { Prisma } from '@prisma/client';

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minScore?: number;
  tags?: string[];
  status?: string;
  trending?: boolean;
  featured?: boolean;
  sortBy?: 'price_low' | 'price_high' | 'score' | 'trending' | 'newest';
  page?: number;
  limit?: number;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: ProductFilters) {
    const {
      category,
      subcategory,
      brand,
      minScore,
      tags,
      trending,
      featured,
      sortBy = 'score',
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.ProductWhereInput = {
      status: 'PUBLISHED',
      ...(category && { category }),
      ...(subcategory && { subcategory }),
      ...(brand && { brand }),
      ...(minScore && { aiScore: { gte: minScore } }),
      ...(tags?.length && { tags: { hasSome: tags } }),
      ...(trending !== undefined && { trending }),
      ...(featured !== undefined && { featured }),
    };

    // Price filtering requires a subquery on relations
    if (filters.minPrice || filters.maxPrice) {
      where.prices = {
        some: {
          inStock: true,
          ...(filters.minPrice && { price: { gte: filters.minPrice } }),
          ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
        },
      };
    }

    const orderBy = this.buildSortOrder(sortBy);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          prices: { where: { inStock: true }, orderBy: { price: 'asc' } },
          specs: { where: { highlight: true }, orderBy: { sortOrder: 'asc' } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        prices: { orderBy: { price: 'asc' } },
        specs: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          orderBy: { helpful: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  async findById(id: string) {
    return this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: {
        prices: true,
        specs: true,
      },
    });
  }

  async getTrending(limit = 10) {
    return this.prisma.product.findMany({
      where: { trending: true, status: 'PUBLISHED' },
      include: {
        prices: { where: { inStock: true }, orderBy: { price: 'asc' }, take: 1 },
        specs: { where: { highlight: true } },
      },
      orderBy: { aiScore: 'desc' },
      take: limit,
    });
  }

  async getDeals(limit = 10) {
    // Products where current price < original price
    return this.prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        prices: {
          some: {
            inStock: true,
            originalPrice: { not: null },
          },
        },
      },
      include: {
        prices: {
          where: { inStock: true },
          orderBy: { price: 'asc' },
        },
      },
      orderBy: { aiScore: 'desc' },
      take: limit,
    });
  }

  async getByCategory(category: string, limit = 20) {
    return this.prisma.product.findMany({
      where: { category, status: 'PUBLISHED' },
      include: {
        prices: { where: { inStock: true }, orderBy: { price: 'asc' }, take: 1 },
      },
      orderBy: { aiScore: 'desc' },
      take: limit,
    });
  }

  async updateAIScore(productId: string, score: number, summary: string, pros: string[], cons: string[]) {
    return this.prisma.product.update({
      where: { id: productId },
      data: { aiScore: score, aiSummary: summary, pros, cons },
    });
  }

  private buildSortOrder(sortBy: string): Prisma.ProductOrderByWithRelationInput {
    switch (sortBy) {
      case 'price_low':
        return { prices: { _count: 'asc' } };
      case 'price_high':
        return { prices: { _count: 'desc' } };
      case 'score':
        return { aiScore: 'desc' };
      case 'newest':
        return { createdAt: 'desc' };
      case 'trending':
      default:
        return { aiScore: 'desc' };
    }
  }
}
