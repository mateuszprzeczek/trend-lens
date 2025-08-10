import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';

jest.setTimeout(60000);

describe('Trends details (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    // Seed database
    await import('../prisma/seed');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Keep minimal global pipe similar to production (optional)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });

  it('GET /trends/:id should return sensible growth timeline for last 14 days', async () => {
    const anyTrend = await prisma.trend.findFirst({});
    expect(anyTrend).toBeTruthy();
    const trendId = anyTrend!.id;

    const server = app.getHttpServer();

    const res = await request(server)
      .get(`/trends/${trendId}`)
      // dev guard allows unauthenticated; but to be safe provide a dummy x-company-id
      .set('x-company-id', 'test-company')
      .expect(200);

    const body = res.body as {
      id: string;
      name: string;
      explanations: string[];
      sources_timeline: { date: string; mentions: number; source: 'GOOGLE_TRENDS' | 'REDDIT' | 'YOUTUBE' }[];
    };

    expect(body.id).toBe(trendId);
    expect(Array.isArray(body.explanations)).toBe(true);
    expect(body.explanations.length).toBeGreaterThanOrEqual(3);
    expect(body.explanations.length).toBeLessThanOrEqual(5);

    // There should be at least 20 records from 14 days across 3 sources
    expect(Array.isArray(body.sources_timeline)).toBe(true);
    expect(body.sources_timeline.length).toBeGreaterThanOrEqual(20);

    // Validate structure and ordering by date asc
    const dates = body.sources_timeline.map((e) => e.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);

    // Dates should be in YYYY-MM-DD
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    for (const entry of body.sources_timeline) {
      expect(dateRe.test(entry.date)).toBe(true);
      expect(['GOOGLE_TRENDS', 'REDDIT', 'YOUTUBE']).toContain(entry.source);
      expect(typeof entry.mentions).toBe('number');
    }
  });
});
