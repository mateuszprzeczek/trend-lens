import { Controller, Get, Query, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { GetAuditDto } from './dto/get-audit.dto';
import type { Request } from 'express';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getAudit(@Query() query: GetAuditDto, @Req() req: Request) {
    const companyId = ((req as any).user?.companyId as string) || (req.headers['x-company-id'] as string) || undefined;
    return this.auditService.find(companyId, query.entity, query.entityId);
  }
}
