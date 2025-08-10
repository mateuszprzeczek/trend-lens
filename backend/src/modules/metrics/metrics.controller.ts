import { Body, Controller, Post } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { IngestMetricDto } from './dto/ingest-metric.dto';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Post('ingest')
  ingest(@Body() body: IngestMetricDto) {
    return this.metricsService.ingest(body);
  }
}
