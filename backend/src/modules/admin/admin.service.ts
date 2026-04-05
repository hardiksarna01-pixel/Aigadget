import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalProducts,
      publishedProducts,
      draftProducts,
      totalComparisons,
      totalSeoPages,
      totalClicks,
      recentClicks,
      scraperJobs,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.product.count({ where: { status: 'DRAFT' } }),
      this.prisma.comparison.count(),
      this.prisma.seoPage.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.affiliateClick.count(),
      this.prisma.affiliateClick.count({
        where: { clickedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.scraperJob.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      products: { total: totalProducts, published: publishedProducts, draft: draftProducts },
      comparisons: totalComparisons,
      seoPages: totalSeoPages,
      affiliateClicks: { total: totalClicks, last24h: recentClicks },
      scraperJobs: scraperJobs.reduce((acc, j) => ({ ...acc, [j.status]: j._count }), {}),
    };
  }

  async getProductsForApproval(page = 1, limit = 20) {
    return this.prisma.product.findMany({
      where: { status: 'DRAFT' },
      include: {
        prices: { take: 1 },
        specs: { where: { highlight: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async approveProduct(productId: string) {
    return this.prisma.product.update({
      where: { id: productId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async archiveProduct(productId: string) {
    return this.prisma.product.update({
      where: { id: productId },
      data: { status: 'ARCHIVED' },
    });
  }

  async getAffiliateAnalytics(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [clicksByPlatform, clicksByDay, topProducts, totalRevenue] = await Promise.all([
      this.prisma.affiliateClick.groupBy({
        by: ['platform'],
        _count: true,
        where: { clickedAt: { gte: since } },
      }),
      this.prisma.$queryRaw`
        SELECT DATE(clicked_at) as date, COUNT(*) as clicks
        FROM affiliate_clicks
        WHERE clicked_at >= ${since}
        GROUP BY DATE(clicked_at)
        ORDER BY date DESC
      `,
      this.prisma.affiliateClick.groupBy({
        by: ['productId'],
        _count: true,
        where: { clickedAt: { gte: since } },
        orderBy: { _count: { productId: 'desc' } },
        take: 10,
      }),
      this.prisma.affiliateClick.aggregate({
        _sum: { revenue: true },
        where: { clickedAt: { gte: since }, converted: true },
      }),
    ]);

    return {
      clicksByPlatform: clicksByPlatform.map((c) => ({ platform: c.platform, clicks: c._count })),
      clicksByDay,
      topProducts,
      totalRevenue: totalRevenue._sum.revenue || 0,
    };
  }
}
