import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Local type to avoid depending on generated Prisma types at compile time
export type AuditEntity = 'TREND' | 'CAMPAIGN';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  find(companyId: string | undefined, entity?: AuditEntity, entityId?: string, limit: number = 50) {
    const safeLimit = Math.min(Math.max(limit || 50, 1), 200);
    return (this.prisma as any).auditLog.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(entity ? { entity } : {}),
        ...(entityId ? { entityId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });
  }
}
