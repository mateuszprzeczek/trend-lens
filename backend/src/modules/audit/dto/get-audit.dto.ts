import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { AuditEntity } from '../audit.service';

export class GetAuditDto {
  @IsOptional()
  @IsEnum(['TREND', 'CAMPAIGN'] as any)
  entity?: AuditEntity;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
