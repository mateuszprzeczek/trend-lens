import { ApiProperty } from '../../../common/swagger';

export class TrendMatchDto {
  @ApiProperty()
  productId: string;

  @ApiProperty({ example: 0.812 })
  matchScore: number;

  @ApiProperty({ example: 0.523 })
  profitScore: number;

  @ApiProperty({ type: [String] })
  reasons: string[];
}
