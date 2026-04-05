import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: { email: string; name?: string }) {
    return this.prisma.user.create({ data });
  }

  async updatePreferences(userId: string, preferences: Record<string, any>) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { preferences },
    });
  }

  async addSearchToHistory(userId: string, query: string) {
    const user = await this.findById(userId);
    const history = (user.searchHistory as string[]) || [];
    const updated = [query, ...history.filter((q) => q !== query)].slice(0, 50);

    return this.prisma.user.update({
      where: { id: userId },
      data: { searchHistory: updated },
    });
  }
}
