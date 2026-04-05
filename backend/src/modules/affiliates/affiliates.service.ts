import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { createHash } from 'crypto';

interface TrackClickParams {
  productId: string;
  platform: string;
  url: string;
  userId?: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class AffiliatesService {
  constructor(private prisma: PrismaService) {}

  async trackClick(params: TrackClickParams) {
    const ipHash = params.ip
      ? createHash('sha256').update(params.ip).digest('hex').slice(0, 16)
      : undefined;

    const click = await this.prisma.affiliateClick.create({
      data: {
        productId: params.productId,
        userId: params.userId,
        platform: params.platform,
        url: params.url,
        referrer: params.referrer,
        userAgent: params.userAgent,
        ipHash,
      },
    });

    return { clickId: click.id, redirectUrl: params.url };
  }

  async markConversion(clickId: string, revenue: number) {
    return this.prisma.affiliateClick.update({
      where: { id: clickId },
      data: { converted: true, revenue },
    });
  }

  async getClickStats(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalClicks, conversions, revenue, byPlatform] = await Promise.all([
      this.prisma.affiliateClick.count({ where: { clickedAt: { gte: since } } }),
      this.prisma.affiliateClick.count({ where: { clickedAt: { gte: since }, converted: true } }),
      this.prisma.affiliateClick.aggregate({
        _sum: { revenue: true },
        where: { clickedAt: { gte: since }, converted: true },
      }),
      this.prisma.affiliateClick.groupBy({
        by: ['platform'],
        _count: true,
        where: { clickedAt: { gte: since } },
        orderBy: { _count: { platform: 'desc' } },
      }),
    ]);

    return {
      totalClicks,
      conversions,
      conversionRate: totalClicks > 0 ? (conversions / totalClicks) * 100 : 0,
      totalRevenue: revenue._sum.revenue || 0,
      byPlatform: byPlatform.map((p) => ({ platform: p.platform, clicks: p._count })),
    };
  }
}
