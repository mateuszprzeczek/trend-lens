import { ApiProperty } from '../../../common/swagger';

export class TrendSourceWeightDto {
  @ApiProperty({ example: 'GOOGLE_TRENDS' })
  source: string;

  @ApiProperty({ example: 0.6 })
  weight: number;
}

export class TrendRecommendationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Overall score (0..1 or 0..100 depending on seed)' })
  score: number;

  @ApiProperty({ description: '7d growth value' })
  growth7d: number;

  @ApiProperty({ required: false, nullable: true })
  forecastPeakInDays?: number | null;

  @ApiProperty({ type: [TrendSourceWeightDto] })
  sources: TrendSourceWeightDto[];

  @ApiProperty({ type: [String] })
  explanations: string[];
}
