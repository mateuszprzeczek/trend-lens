import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Provide a sensible default for local development if DATABASE_URL isn't set
    const defaultUrl = 'postgresql://postgres:postgres@localhost:5440/ai_trends?schema=public';
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = defaultUrl;
      PrismaService.logger.warn('DATABASE_URL not set. Using local default from docker-compose (postgres://localhost:5440/ai_trends).');
    }

    // Also pass explicit datasource override to be resilient
    super({ datasources: { db: { url: process.env.DATABASE_URL || defaultUrl } } });
  }

  async onModuleInit() {
    await this.$connect();
    await this.ensureDatabase();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureDatabase() {
    // Only auto-init in non-production environments
    const env = (process.env.NODE_ENV || 'development').toLowerCase();
    if (env === 'production') {
      return;
    }

    try {
      // Check if the Campaign table exists in the connected database
      const rows: Array<{ exists: boolean }> = (await this.$queryRawUnsafe(
        "select exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'Campaign') as exists"
      )) as any;
      const exists = Array.isArray(rows) && rows.length > 0 && (rows[0] as any).exists === true;
      if (exists) return;
    } catch (e) {
      // If query fails, we'll still try to push as a best-effort in dev
      PrismaService.logger.warn(`DB existence check failed (${(e as Error).message}); attempting prisma db push...`);
    }

    try {
      PrismaService.logger.warn('Prisma auto-init: tables missing; running "prisma db push" (dev only)...');
      // Run prisma db push from the backend directory to respect local prisma schema path
      await execFileAsync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'db', 'push', '--skip-generate', '--accept-data-loss'], {
        cwd: process.cwd(),
        env: process.env,
      });
      PrismaService.logger.log('Prisma auto-init: db push completed');
    } catch (e) {
      PrismaService.logger.error(`Prisma auto-init failed: ${(e as Error).message}`);
    }
  }
}
