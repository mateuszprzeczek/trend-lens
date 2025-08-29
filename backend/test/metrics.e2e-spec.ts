import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';

jest.setTimeout(60000);

describe('Metrics ingest (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await import('../prisma/seed');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

  it('rejects ts more than 5 minutes in the future', async () => {
    const campaign = await prisma.campaign.findFirst();
    expect(campaign).toBeTruthy();

    const server = app.getHttpServer();
    const future = new Date(Date.now() + 6 * 60 * 1000).toISOString();

    await request(server)
      .post('/metrics/ingest')
      .send({
        campaignId: campaign!.id,
        channel: 'push',
        event: 'CLICK',
        ts: future,
      })
      .expect(400);
  });

  it('ingests events and returns totals', async () => {
    const campaign = await prisma.campaign.findFirst();
    expect(campaign).toBeTruthy();

    const server = app.getHttpServer();
    const nowIso = new Date().toISOString();

    // Add some impressions
    let res = await request(server)
      .post('/metrics/ingest')
      .send({ campaignId: campaign!.id, channel: 'push', event: 'IMPRESSION', value: 5, ts: nowIso })
      .expect(201);
    let body = res.body as any;
    expect(body.totals.impressions).toBeGreaterThanOrEqual(5);

    // Add click
    res = await request(server)
      .post('/metrics/ingest')
      .send({ campaignId: campaign!.id, channel: 'push', event: 'CLICK', value: 2, ts: nowIso })
      .expect(201);
    body = res.body as any;
    expect(body.totals.clicks).toBeGreaterThanOrEqual(2);

    // Add conversion
    res = await request(server)
      .post('/metrics/ingest')
      .send({ campaignId: campaign!.id, channel: 'push', event: 'CONVERSION', ts: nowIso })
      .expect(201);
    body = res.body as any;
    expect(body.totals.conversions).toBeGreaterThanOrEqual(1);
  });
});
