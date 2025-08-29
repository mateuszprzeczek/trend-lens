import { ApiProperty } from '../../../common/swagger';

export class AuditLogDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty({ enum: ['TREND', 'CAMPAIGN'] })
  entity: 'TREND' | 'CAMPAIGN';

  @ApiProperty()
  entityId: string;

  @ApiProperty()
  action: string;

  @ApiProperty({ required: false, type: Object, nullable: true })
  details?: any;

  @ApiProperty({ description: 'ISO timestamp' })
  createdAt: string;
}
