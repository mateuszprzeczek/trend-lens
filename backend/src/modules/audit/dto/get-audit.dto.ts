import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { AuditEntity } from '../audit.service';

export class GetAuditDto {
  @IsOptional()
  @IsEnum(['TREND', 'CAMPAIGN'] as any)
  entity?: AuditEntity;

  @IsOptional()
  @IsString()
  entityId?: string;
}
