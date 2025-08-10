import { Body, Controller, Post, Req } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { GenerateCampaignDto } from './dto/generate-campaign.dto';
import { LaunchCampaignDto } from './dto/launch-campaign.dto';
import type { Request } from 'express';
import { ApiOkResponse, ApiTags } from '../../common/swagger';
import { GenerateCampaignResponseDto, LaunchCampaignResponseDto } from './dto/campaign.dto';

@ApiTags('Campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post('generate')
  @ApiOkResponse({ type: GenerateCampaignResponseDto })
  generate(@Body() body: GenerateCampaignDto, @Req() req: Request) {
    const companyId = ((req as any).user?.companyId as string) || (req.headers['x-company-id'] as string) || undefined;
    return this.campaignsService.generate(body, companyId);
  }

  @Post('launch')
  @ApiOkResponse({ type: LaunchCampaignResponseDto })
  launch(@Body() body: LaunchCampaignDto, @Req() req: Request) {
    const companyId = ((req as any).user?.companyId as string) || (req.headers['x-company-id'] as string) || undefined;
    return this.campaignsService.launch(body, companyId);
  }
}
