import { Controller, Get, Req } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import type { Request } from 'express';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  getMe(@Req() req: Request) {
    const companyId = ((req as any).user?.companyId as string) || (req.headers['x-company-id'] as string) || undefined;
    return this.companiesService.getMe(companyId);
  }
}
