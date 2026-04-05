import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { PrismaService } from '@/database/prisma.service';

class ChatRequestDto {
  sessionId?: string;
  message: string;
  history?: Array<{ role: string; content: string }>;
}

@ApiTags('ai')
@Controller('ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI product advisor' })
  async chat(@Body() body: ChatRequestDto) {
    const messages = [
      ...(body.history || []),
      { role: 'user', content: body.message },
    ];

    // Fetch some context products for the AI
    const products = await this.prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      include: { prices: { take: 1, orderBy: { price: 'asc' } } },
      orderBy: { aiScore: 'desc' },
      take: 10,
    });

    const result = await this.aiService.chat(messages, { products });

    // Persist to chat session if sessionId provided
    if (body.sessionId) {
      await this.prisma.chatMessage.createMany({
        data: [
          { sessionId: body.sessionId, role: 'user', content: body.message },
          { sessionId: body.sessionId, role: 'assistant', content: result.response, metadata: { productCards: result.productCards } },
        ],
      });
    }

    return result;
  }

  @Post('chat/session')
  @ApiOperation({ summary: 'Create a new chat session' })
  async createSession() {
    const session = await this.prisma.chatSession.create({ data: {} });
    return { sessionId: session.id };
  }

  @Get('chat/session/:id')
  @ApiOperation({ summary: 'Get chat session history' })
  async getSession(@Param('id') id: string) {
    return this.prisma.chatSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }
}
