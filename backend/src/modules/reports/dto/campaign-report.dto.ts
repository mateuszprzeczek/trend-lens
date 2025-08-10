import { ApiProperty } from '../../../common/swagger';

export class CampaignReportTimeToTrendDto {
  @ApiProperty({ nullable: true })
  launched_days_before_peak: number | null;
}

export class CampaignBestVariantDto {
  @ApiProperty()
  channel: string;

  @ApiProperty()
  variant: string;
}

export class CampaignReportDto {
  @ApiProperty()
  campaign_id: string;

  @ApiProperty()
  roi: number;

  @ApiProperty()
  spend: number;

  @ApiProperty()
  revenue: number;

  @ApiProperty({ type: Object, description: 'Map of channel -> CTR value' })
  ctr: Record<string, number>;

  @ApiProperty()
  conversions: number;

  @ApiProperty({ type: CampaignReportTimeToTrendDto })
  time_to_trend: CampaignReportTimeToTrendDto;

  @ApiProperty({ type: CampaignBestVariantDto, nullable: true })
  best_variant: CampaignBestVariantDto | null;

  @ApiProperty({ type: [String] })
  insights: string[];
}
