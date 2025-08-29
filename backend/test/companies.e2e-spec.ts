import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';

jest.setTimeout(60000);

describe('Companies getMe (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    // Seed database
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

  it('GET /companies/me returns company with brand and geo fields from seed', async () => {
    const company = await prisma.company.findFirst();
    expect(company).toBeTruthy();

    const server = app.getHttpServer();
    const res = await request(server)
      .get('/companies/me')
      .set('x-company-id', company!.id)
      .expect(200);

    const body = res.body as any;

    expect(body.id).toBe(company!.id);
    expect(body.name).toBe(company!.name);
    expect(body.geoLat).toBeCloseTo(company!.geoLat, 3);
    expect(body.geoLng).toBeCloseTo(company!.geoLng, 3);
    expect(body.radiusKm).toBe(company!.radiusKm);
    expect(body.language).toBe(company!.language);
    expect(body.brand).toBeTruthy();
    expect(body.brand.primary).toBe(company!.brandPrimary);
    expect(body.brand.secondary).toBe(company!.brandSecondary);
    expect(body.brand.tone).toBe(company!.brandTone);
    expect(body.brand.logoUrl).toBe(company!.logoUrl);
  });
});
