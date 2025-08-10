import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AuditEntity } from '@prisma/client';

export class GetAuditDto {
  @IsOptional()
  @IsEnum(AuditEntity)
  entity?: AuditEntity;

  @IsOptional()
  @IsString()
  entityId?: string;
}
