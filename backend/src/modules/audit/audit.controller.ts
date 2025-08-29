import { Controller, Get, Query, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { GetAuditDto } from './dto/get-audit.dto';
import type { Request } from 'express';
import { ApiOkResponse, ApiTags } from '../../common/swagger';
import { AuditLogDto } from './dto/audit-log.dto';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOkResponse({ type: [AuditLogDto] })
  getAudit(@Query() query: GetAuditDto, @Req() req: Request) {
    const companyId = ((req as any).user?.companyId as string) || (req.headers['x-company-id'] as string) || undefined;
    const limit = query.limit ?? 50;
    return this.auditService.find(companyId, query.entity, query.entityId, limit);
  }
}
