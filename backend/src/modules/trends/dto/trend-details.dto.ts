import { ApiProperty } from '../../../common/swagger';

export class TrendSourcePointDto {
  @ApiProperty({ example: '2025-08-01', description: 'UTC date YYYY-MM-DD' })
  date: string;

  @ApiProperty({ example: 123, description: 'Mentions aggregated for this day/source' })
  mentions: number;

  @ApiProperty({ enum: ['GOOGLE_TRENDS', 'REDDIT', 'YOUTUBE'] })
  source: 'GOOGLE_TRENDS' | 'REDDIT' | 'YOUTUBE';
}

export class TrendDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  explanations: string[];

  @ApiProperty({ type: [TrendSourcePointDto] })
  sources_timeline: TrendSourcePointDto[];
}
