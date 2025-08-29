import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthGuard } from './common/guards/auth.guard';
import crypto from 'crypto';

// Simple in-memory Prisma mock used only by this e2e test
class InMemoryPrismaService {
  // stores
  users: any[] = [];
  companies: any[] = [];
  products: any[] = [];
  trends: any[] = [];
  campaigns: any[] = [];
  auditLogs: any[] = [];
  metrics: any[] = [];

  // helpers
  private genId(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  user = {
    findUnique: async ({ where: { email } }: any) => this.users.find((u) => u.email === email) || null,
  };

  company = {
    findFirst: async () => this.companies[0] || null,
    create: async ({ data }: any) => {
      const id = this.genId('cmp');
      const rec = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      this.companies.push(rec);
      return rec;
    },
  };

  product = {
    createMany: async ({ data }: any) => {
      for (const d of data) {
        const id = this.genId('prd');
        const rec = { id, ...d, createdAt: new Date(), updatedAt: new Date() };
        this.products.push(rec);
      }
      return { count: data.length };
    },
    findMany: async ({ where, take, orderBy }: any = {}) => {
      let arr = [...this.products];
      if (where?.companyId) arr = arr.filter((p) => p.companyId === where.companyId);
      // ignore orderBy in mock
      if (take) arr = arr.slice(0, take);
      return arr;
    },
  };

  trend = {
    findMany: async ({ take, orderBy }: any = {}) => {
      let arr = [...this.trends];
      if (take) arr = arr.slice(0, take);
      return arr;
    },
    findUnique: async ({ where: { id } }: any) => this.trends.find((t) => t.id === id) || null,
  };

  campaign = {
    create: async ({ data }: any) => {
      const id = this.genId('cmpgn');
      const rec = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      this.campaigns.push(rec);
      return rec;
    },
    findUnique: async ({ where: { id } }: any) => this.campaigns.find((c) => c.id === id) || null,
    update: async ({ where: { id }, data }: any) => {
      const idx = this.campaigns.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      const updated = { ...this.campaigns[idx], ...data, updatedAt: new Date() };
      this.campaigns[idx] = updated;
      return updated;
    },
  };

  auditLog = {
    create: async ({ data }: any) => {
      const id = this.genId('aud');
      const rec = { id, ...data, createdAt: new Date() };
      this.auditLogs.push(rec);
      return rec;
    },
    findMany: async ({ where, orderBy, take }: any) => {
      let arr = this.auditLogs.filter((a) => {
        if (where?.companyId && a.companyId !== where.companyId) return false;
        if (where?.entity && a.entity !== where.entity) return false;
        if (where?.entityId && a.entityId !== where.entityId) return false;
        return true;
      });
      arr.sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      if (take) arr = arr.slice(0, take);
      return arr;
    },
  };

  metric = {
    create: async ({ data }: any) => {
      const id = this.genId('m');
      const rec = { id, ...data };
      this.metrics.push(rec);
      return rec;
    },
    findMany: async ({ where: { campaignId } }: any) => this.metrics.filter((m) => m.campaignId === campaignId),
    deleteMany: async () => ({ count: 0 }),
  };
}

function hashPasswordDev(plain: string): string {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

describe('E2E flow (in-memory)', () => {
  let app: INestApplication;
  let prisma: InMemoryPrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useClass(InMemoryPrismaService as any)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply the same globals as in main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalGuards(new AuthGuard());

    await app.init();

    prisma = app.get(PrismaService) as any as InMemoryPrismaService;

    // Seed minimal data
    const company = await prisma.company.create({
      data: {
        name: 'TestCo',
        geoLat: 50,
        geoLng: 20,
        radiusKm: 100,
        language: 'pl',
      },
    });

    prisma.users.push({
      id: 'usr_1',
      email: 'admin@test.co',
      passwordHash: hashPasswordDev('Admin123!'),
      companyId: company.id,
      role: 'ADMIN',
      createdAt: new Date(),
    });

    prisma.trends.push(
      {
        id: 'tr_real_1',
        name: 'Domy modułowe 70m² w kształcie L',
        clusterId: 'cl_1',
        score: 0.8,
        growth7d: 0.2,
        forecastPeakInDays: 7,
        sources: [{ source: 'GOOGLE_TRENDS', weight: 0.6 }],
        explanations: ['Wzrost zapytań', 'Sezonowość'],
        createdAt: new Date(),
      },
      {
        id: 'tr_real_2',
        name: 'Nowoczesne elewacje drewniane',
        clusterId: 'cl_1',
        score: 0.7,
        growth7d: 0.15,
        forecastPeakInDays: 5,
        sources: [{ source: 'REDDIT', weight: 0.4 }],
        explanations: ['Więcej materiałów video'],
        createdAt: new Date(),
      }
    );

    await prisma.product.createMany({
      data: [
        {
          companyId: company.id,
          title: 'Dom modułowy L-70',
          description: 'Dom 70m2 w kształcie L',
          price: 299000,
          margin: 0.3,
          availability: 'IN_STOCK',
          tags: ['modułowy', 'L-70'],
          embedding: Array.from({ length: 32 }, (_, i) => Math.sin(i) * 0.05),
        },
        {
          companyId: company.id,
          title: 'Elewacja drewniana',
          description: 'Thermo-drewno nowoczesne',
          price: 45000,
          margin: 0.35,
          availability: 'LIMITED',
          tags: ['elewacja', 'drewno'],
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('runs the full flow', async () => {
    // 1) Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.co', password: 'Admin123!' })
      .expect(201);
    const token = loginRes.body.accessToken;
    expect(typeof token).toBe('string');

    // 2) Get trends
    const recRes = await request(app.getHttpServer())
      .get('/trends/recommendations')
      .set('Authorization', `Bearer ${token}`)
      .query({ lat: 50, lng: 20, radius_km: 50, limit: 3 })
      .expect(200);
    expect(Array.isArray(recRes.body)).toBe(true);
    const trendId = recRes.body[0].id;

    // 3) Matches
    const matchesRes = await request(app.getHttpServer())
      .get(`/trends/${trendId}/matches`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(matchesRes.body)).toBe(true);
    const firstProductId = prisma.products[0].id;

    // 4) Generate campaign
    const genRes = await request(app.getHttpServer())
      .post('/campaigns/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ trendId, products: [firstProductId], channels: ['push', 'email'], brandPreferences: { tone: 'inspirujący' } })
      .expect(201);
    const campaignId = genRes.body.campaignId;
    expect(campaignId).toBeTruthy();

    // 5) Launch campaign (now)
    const nowIso = new Date().toISOString();
    await request(app.getHttpServer())
      .post('/campaigns/launch')
      .set('Authorization', `Bearer ${token}`)
      .send({ campaignId, schedule: nowIso, budgets: { push: 100, email: 50 }, audiences: { push: ['all'], email: ['recent'] } })
      .expect(201);

    // 6) Ingest some metrics
    const server = app.getHttpServer();
    // impressions and clicks for push A
    await request(server).post('/metrics/ingest').set('Authorization', `Bearer ${token}`).send({ campaignId, channel: 'push', variant: 'A', event: 'impression', value: 100, ts: new Date().toISOString() }).expect(201);
    await request(server).post('/metrics/ingest').set('Authorization', `Bearer ${token}`).send({ campaignId, channel: 'push', variant: 'A', event: 'click', value: 10, ts: new Date().toISOString() }).expect(201);
    // email B
    await request(server).post('/metrics/ingest').set('Authorization', `Bearer ${token}`).send({ campaignId, channel: 'email', variant: 'B', event: 'impression', value: 50, ts: new Date().toISOString() }).expect(201);
    await request(server).post('/metrics/ingest').set('Authorization', `Bearer ${token}`).send({ campaignId, channel: 'email', variant: 'B', event: 'click', value: 8, ts: new Date().toISOString() }).expect(201);
    // conversion
    await request(server).post('/metrics/ingest').set('Authorization', `Bearer ${token}`).send({ campaignId, channel: 'email', variant: 'B', event: 'conversion', value: 1200, ts: new Date().toISOString() }).expect(201);

    // 7) Report
    const repRes = await request(server).get(`/reports/campaign/${campaignId}`).set('Authorization', `Bearer ${token}`).expect(200);
    const body = repRes.body;
    // Assertions on keys
    expect(body).toHaveProperty('campaignId');
    expect(body).toHaveProperty('roi');
    expect(body).toHaveProperty('spend');
    expect(body).toHaveProperty('revenue');
    expect(body).toHaveProperty('ctr');
    expect(body).toHaveProperty('conversions');
    expect(body).toHaveProperty('time_to_trend');
    expect(body).toHaveProperty('best_variant');
    expect(body).toHaveProperty('insights');
  });
});
