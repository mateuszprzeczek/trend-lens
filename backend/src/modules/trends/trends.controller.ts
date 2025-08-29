import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { TrendsService } from './trends.service';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';
import type { Request } from 'express';
import { ApiOkResponse, ApiTags } from '../../common/swagger';
import { TrendRecommendationDto } from './dto/trend-recommendation.dto';
import { TrendDetailsDto } from './dto/trend-details.dto';
import { TrendMatchDto } from './dto/trend-match.dto';

@ApiTags('Trends')
@Controller('trends')
export class TrendsController {
  constructor(private readonly trendsService: TrendsService) {}

  @Get('recommendations')
  @ApiOkResponse({ type: [TrendRecommendationDto] })
  getRecommendations(@Query() query: GetRecommendationsDto) {
    return this.trendsService.getRecommendations(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: TrendDetailsDto })
  getDetails(@Param('id') id: string) {
    return this.trendsService.getDetails(id);
  }

  @Get(':id/matches')
  @ApiOkResponse({ type: [TrendMatchDto] })
  getMatches(@Param('id') id: string, @Req() req: Request) {
    const companyId = ((req as any).user?.companyId as string) || (req.headers['x-company-id'] as string) || undefined;
    return this.trendsService.getMatches(id, companyId);
  }
}
