import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface EmailPayload {
  subject: string;
  html: string;
  list: string[]; // audience/list identifiers
}

@Injectable()
export class SendGridClient {
  constructor(private readonly prisma: PrismaService) {}

  async sendEmail(companyId: string, campaignId: string, payload: EmailPayload) {
    const errors: string[] = [];
    if (!payload || typeof payload !== 'object') errors.push('payload: required');
    if (!payload.subject || typeof payload.subject !== 'string') errors.push('subject: required string');
    if (!payload.html || typeof payload.html !== 'string') errors.push('html: required string');
    if (!Array.isArray(payload.list)) errors.push('list: required string[]');

    await (this.prisma as any).auditLog.create({
      data: {
        companyId,
        entity: 'CAMPAIGN',
        entityId: campaignId,
        action: 'EMAIL:SENT:STUB',
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
