import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { ReviewSynthesizer } from './review-synthesizer.service';
import { VectorSearchService } from './vector-search.service';

@Module({
  controllers: [AIController],
  providers: [AIService, ReviewSynthesizer, VectorSearchService],
  exports: [AIService, ReviewSynthesizer, VectorSearchService],
})
export class AIModule {}
