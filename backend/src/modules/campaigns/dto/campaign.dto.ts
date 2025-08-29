import { ApiProperty } from '../../../common/swagger';

export class CampaignDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  trendId: string;

  @ApiProperty({ type: [String] })
  channels: string[];

  @ApiProperty({ enum: ['DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'FINISHED'] })
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'FINISHED';

  @ApiProperty({ required: false, nullable: true })
  schedule?: string | null;

  @ApiProperty({ required: false, type: Object })
  budgets?: Record<string, number> | null;

  @ApiProperty({ required: false, type: Object })
  assets?: any;

  @ApiProperty()
  abVariants: number;
}

export class GenerateCampaignResponseDto {
  @ApiProperty()
  campaignId: string;

  @ApiProperty({ type: Object })
  assets: any;

  @ApiProperty()
  abVariants: number;
}

export class LaunchCampaignResponseDto {
  @ApiProperty()
  campaignId: string;

  @ApiProperty({ enum: ['DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'FINISHED'] })
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'FINISHED';

  @ApiProperty()
  schedule: string;
}
