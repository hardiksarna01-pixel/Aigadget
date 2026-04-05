import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);
  private openai: OpenAI;
  private pineconeApiKey: string;
  private pineconeIndexUrl: string;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
    this.pineconeApiKey = this.config.get<string>('PINECONE_API_KEY') || '';
    this.pineconeIndexUrl = this.config.get<string>('PINECONE_INDEX_URL') || '';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async upsertProductEmbedding(productId: string, productText: string): Promise<void> {
    const embedding = await this.generateEmbedding(productText);

    await fetch(`${this.pineconeIndexUrl}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Api-Key': this.pineconeApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors: [
          {
            id: productId,
            values: embedding,
            metadata: { productId },
          },
        ],
      }),
    });

    this.logger.log(`Upserted embedding for product ${productId}`);
  }

  async semanticSearch(query: string, topK = 10): Promise<string[]> {
    const queryEmbedding = await this.generateEmbedding(query);

    const response = await fetch(`${this.pineconeIndexUrl}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': this.pineconeApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      }),
    });

    const data = await response.json();
    return data.matches?.map((m: any) => m.metadata.productId) || [];
  }
}
