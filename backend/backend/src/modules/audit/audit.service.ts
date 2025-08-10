import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditEntity } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  find(companyId: string | undefined, entity?: AuditEntity, entityId?: string) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(entity ? { entity } : {}),
        ...(entityId ? { entityId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
