import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { TrendsService } from './trends.service';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';
import { Request } from 'express';

@Controller('trends')
export class TrendsController {
  constructor(private readonly trendsService: TrendsService) {}

  @Get('recommendations')
  getRecommendations(@Query() query: GetRecommendationsDto) {
    return this.trendsService.getRecommendations(query);
  }

  @Get(':id/matches')
  getMatches(@Param('id') id: string, @Req() req: Request) {
    const companyId = ((req as any).user?.companyId as string) || (req.headers['x-company-id'] as string) || undefined;
    return this.trendsService.getMatches(id, companyId);
  }
}
