import { Controller, Get, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ApiOkResponse, ApiTags } from '../../common/swagger';
import { CampaignReportDto } from './dto/campaign-report.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('campaign/:id')
  @ApiOkResponse({ type: CampaignReportDto })
  getCampaignReport(@Param('id') id: string) {
    return this.reportsService.getCampaignReport(id);
  }
}
