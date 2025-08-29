import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string | null;
  url?: string | null;
  audience: string[]; // e.g. segments/tags
}

@Injectable()
export class OneSignalClient {
  constructor(private readonly prisma: PrismaService) {}

  async sendPush(companyId: string, campaignId: string, payload: PushPayload) {
    const errors: string[] = [];
    if (!payload || typeof payload !== 'object') errors.push('payload: required');
    if (!payload.title || typeof payload.title !== 'string') errors.push('title: required string');
    if (!payload.body || typeof payload.body !== 'string') errors.push('body: required string');
    if (!Array.isArray(payload.audience)) errors.push('audience: required string[]');

    // For MVP, do not call external API; just record audit log
    await (this.prisma as any).auditLog.create({
      data: {
        companyId,
        entity: 'CAMPAIGN',
        entityId: campaignId,
        action: 'PUSH:SENT:STUB',
        details: {
          valid: errors.length === 0,
          errors: errors.length ? errors : undefined,
          payload: payload as any,
        } as any,
      },
    });

    return { ok: errors.length === 0 };
  }
}
