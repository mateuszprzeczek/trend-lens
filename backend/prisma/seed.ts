import { PrismaClient, Prisma, ProductAvailability, TrendSignalSource, UserRole, CampaignStatus, MetricEvent } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPasswordDev(plain: string): string {
  // Simple SHA-256 for development seeding only (not for production)
  return crypto.createHash('sha256').update(plain).digest('hex');
}

async function main() {
  // Clean existing data to keep the seed idempotent
  await prisma.metric.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.trendSignal.deleteMany();
  await prisma.trend.deleteMany();
  await prisma.trendCluster.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.company.deleteMany();

  // Create Company: ModułDom (Kraków)
  const company = await prisma.company.create({
    data: {
      name: 'ModułDom',
      geoLat: 50.0647,
      geoLng: 19.9450,
      radiusKm: 200,
      language: 'pl',
      brandPrimary: '#0e7490',
      brandSecondary: '#65a30d',
      brandTone: 'inspirujący, nowoczesny, proekologiczny',
      logoUrl: 'https://dummyimage.com/200x200/0e7490/ffffff.png&text=Modu%C5%82Dom',
    },
  });

  // Products (4–6)
  const productsData: Prisma.ProductCreateManyInput[] = [
    {
      companyId: company.id,
      title: 'Dom modułowy L-70',
      description: 'Nowoczesny dom modułowy o powierzchni 70 m² w kształcie litery L. Idealny na wąską działkę.',
      price: new Prisma.Decimal('299000'),
      margin: 0.28,
      availability: ProductAvailability.IN_STOCK,
      tags: ['modułowy', 'L-70', 'nowoczesny', 'energooszczędny'],
      embedding: Array.from({ length: 32 }, (_, i) => Math.sin(i) * 0.1),
    },
    {
      companyId: company.id,
      title: 'Projekt wąska działka 7m',
      description: 'Projekt domu zoptymalizowany pod działki o szerokości 7 metrów. Funkcjonalny i jasny.',
      price: new Prisma.Decimal('5900'),
      margin: 0.52,
      availability: ProductAvailability.LIMITED,
      tags: ['projekt', 'wąska działka', '7m', 'funkcjonalny'],
      embedding: Array.from({ length: 32 }, (_, i) => Math.cos(i) * 0.08),
    },
    {
      companyId: company.id,
      title: 'Elewacja drewniana thermo-drewno',
      description: 'Elewacja z thermo-drewna — trwała, naturalna, o nowoczesnym wyglądzie.',
      price: new Prisma.Decimal('45000'),
      margin: 0.35,
      availability: ProductAvailability.IN_STOCK,
      tags: ['elewacja', 'drewno', 'nowoczesna', 'termiczna'],
    },
    {
      companyId: company.id,
      title: 'Dom modułowy 35m² bez pozwolenia',
      description: 'Kompaktowy dom modułowy do 35 m² bez pozwolenia na budowę, całoroczny.',
      price: new Prisma.Decimal('189000'),
      margin: 0.25,
      availability: ProductAvailability.OUT,
      tags: ['35m2', 'bez pozwolenia', 'modułowy', 'całoroczny'],
    },
    {
      companyId: company.id,
      title: 'Pakiet fotowoltaiki 5kW do domu modułowego',
      description: 'Zestaw fotowoltaiczny 5 kW dopasowany do standardowego domu modułowego.',
      price: new Prisma.Decimal('21000'),
      margin: 0.4,
      availability: ProductAvailability.IN_STOCK,
      tags: ['fotowoltaika', 'OZE', 'energooszczędny'],
    },
  ];

  const products = await prisma.product.createMany({ data: productsData });
  // Fetch created products if needed later
  const productsAll = await prisma.product.findMany({ where: { companyId: company.id } });

  // Trend Cluster
  const cluster = await prisma.trendCluster.create({
    data: {
      name: 'Budownictwo 2025',
    },
  });

  // Trends (3–4) with sources & explanations
  const trends = await prisma.$transaction([
    prisma.trend.create({
      data: {
        name: 'Domy modułowe 70m² w kształcie L',
        clusterId: cluster.id,
        score: 0.82,
        growth7d: 0.21,
        forecastPeakInDays: 9,
        sources: [
          { source: 'GOOGLE_TRENDS', weight: 0.6 },
          { source: 'REDDIT', weight: 0.4 },
        ],
        explanations: [
          'Wzrost zapytań „dom modułowy L 70m2” (+42% 7d)',
          'Artykuły poradnikowe o zabudowie wąskich działek',
          'Nowe wątki na forach w Małopolsce',
          'Więcej zapytań o projekty L‑kształtne',
        ],
      },
    }),
    prisma.trend.create({
      data: {
        name: 'Nowoczesne elewacje drewniane',
        clusterId: cluster.id,
        score: 0.74,
        growth7d: 0.18,
        forecastPeakInDays: 6,
        sources: [
          { source: 'GOOGLE_TRENDS', weight: 0.5 },
          { source: 'YOUTUBE', weight: 0.5 },
        ],
        explanations: [
          'Więcej filmów o thermo‑drewnie (+28% 7d)',
          'Moda na naturalne wykończenia',
          'Skoki wzmianek w regionach górskich',
        ],
      },
    }),
    prisma.trend.create({
      data: {
        name: 'Domy do 35m² bez pozwolenia — całoroczne',
        clusterId: cluster.id,
        score: 0.68,
        growth7d: 0.25,
        forecastPeakInDays: 11,
        sources: [
          { source: 'REDDIT', weight: 0.45 },
          { source: 'GOOGLE_TRENDS', weight: 0.55 },
        ],
        explanations: [
          'Wzrost zapytań 7d (+35%)',
          'Nowe interpretacje przepisów (media lokalne)',
          'Dyskusje o całorocznych rozwiązaniach',
          'Wzmożona aktywność grup na FB',
        ],
      },
    }),
  ]);

  // TrendSignals – 14 dni, łagodny wzrost; jeden trend z wyraźnym przyspieszeniem
  const trendList = await prisma.trend.findMany({ where: { clusterId: cluster.id } });
  const now = new Date();
  // Używamy północy UTC dla spójności z agregacją w TrendsService
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (const t of trendList) {
    const signals = [] as Prisma.TrendSignalCreateManyInput[];
    // Bazowe parametry wzrostu dla źródeł
    const baseGoogle = 100 + Math.random() * 30;
    const baseReddit = 30 + Math.random() * 15;
    const baseYouTube = 60 + Math.random() * 20;

    const factorGoogle = 2 + Math.random() * 1.5;
    const factorReddit = 1 + Math.random() * 1.0;
    const factorYouTube = 1.5 + Math.random() * 1.0;

    for (let d = 13; d >= 0; d--) {
      const dayUtc = new Date(todayUtc);
      dayUtc.setUTCDate(todayUtc.getUTCDate() - d);

      // Indeks dnia rosnąco 0..13
      const dayIndex = 13 - d;

      // Przyspieszenie dla trendu "35m² bez pozwolenia" w ostatnich 5 dniach
      const accelerated = t.name.includes('35m²');
      const accelBoost = accelerated && dayIndex >= 9 ? Math.pow(dayIndex - 8, 2) * 1.8 : 0; // wyraźny bump

      const noise = () => (Math.random() - 0.5) * 3; // ±1.5

      const gVal = baseGoogle + dayIndex * factorGoogle + accelBoost + noise();
      const rVal = baseReddit + dayIndex * factorReddit + (accelerated ? accelBoost * 0.35 : 0) + noise();
      const yVal = baseYouTube + dayIndex * factorYouTube + (accelerated ? accelBoost * 0.6 : 0) + noise();

      signals.push({ trendId: t.id, source: TrendSignalSource.GOOGLE_TRENDS, value: Math.round(gVal * 10) / 10, ts: dayUtc });
      signals.push({ trendId: t.id, source: TrendSignalSource.REDDIT, value: Math.round(rVal * 10) / 10, ts: dayUtc });
      signals.push({ trendId: t.id, source: TrendSignalSource.YOUTUBE, value: Math.round(yVal * 10) / 10, ts: dayUtc });
    }
    await prisma.trendSignal.createMany({ data: signals });
  }

  // Create a demo campaign for metrics demo
  const demoTrend = trendList[0];
  const schedule = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6h ago
  const campaign = await prisma.campaign.create({
    data: {
      companyId: company.id,
      trendId: demoTrend.id,
      status: CampaignStatus.RUNNING,
      schedule,
      channels: ['push', 'email'],
      budgets: { push: 300, email: 300 } as unknown as Prisma.JsonObject,
      abVariants: 2,
      assets: { copies: [{ channel: 'push', variant: 'A' }, { channel: 'push', variant: 'B' }, { channel: 'email', variant: 'A' }, { channel: 'email', variant: 'B' }] } as unknown as Prisma.JsonObject,
    },
  });

  // Generate 24h metrics for push and email
  const start = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const end = new Date();
  const stepMin = 15; // every 15 minutes
  const slots = Math.floor((end.getTime() - start.getTime()) / (stepMin * 60 * 1000));
  // Target totals per channel
  const targets = {
    push: { IMPRESSION: 1000, OPEN: 220, CLICK: 60, CONVERSION: 8 },
    email: { IMPRESSION: 1200, OPEN: 380, CLICK: 70, CONVERSION: 12 },
  } as Record<string, Record<'IMPRESSION'|'OPEN'|'CLICK'|'CONVERSION', number>>;

  // helper to generate weight curve with morning/evening peaks
  function weightFor(t: Date) {
    const hour = t.getHours() + t.getMinutes() / 60;
    const morning = Math.max(0, Math.cos(((hour - 9) / 6) * Math.PI));
    const evening = Math.max(0, Math.cos(((hour - 20) / 6) * Math.PI));
    return 0.6 * morning + 0.8 * evening + 0.2; // base
  }

  const metricsBatch: Prisma.MetricCreateManyInput[] = [];
  for (const channel of ['push', 'email'] as const) {
    // Build weights per slot
    const times: Date[] = [];
    const weights: number[] = [];
    for (let i = 0; i <= slots; i++) {
      const ts = new Date(start.getTime() + i * stepMin * 60 * 1000);
      times.push(ts);
      weights.push(weightFor(ts));
    }
    const sumW = weights.reduce((s, v) => s + v, 0) || 1;
    const norm = weights.map((w) => w / sumW);

    // Distribute counts per event type
    const assignCounts = (total: number) => {
      const arr = new Array(times.length).fill(0);
      let remaining = total;
      for (let i = 0; i < times.length; i++) {
        // expected count with small noise
        const expected = total * norm[i];
        const val = Math.max(0, Math.round(expected + (Math.random() - 0.5)));
        arr[i] = val;
        remaining -= val;
      }
      // fix rounding leftovers
      while (remaining > 0) {
        const i = Math.floor(Math.random() * arr.length);
        arr[i] += 1;
        remaining -= 1;
      }
      return arr as number[];
    };

    const imp = assignCounts(targets[channel].IMPRESSION);
    const open = assignCounts(targets[channel].OPEN);
    const click = assignCounts(targets[channel].CLICK);
    const conv = assignCounts(targets[channel].CONVERSION);

    for (let i = 0; i < times.length; i++) {
      const ts = times[i];
      const variant = Math.random() < 0.5 ? 'A' : 'B';
      if (imp[i] > 0) metricsBatch.push({ campaignId: campaign.id, channel, variant, event: MetricEvent.IMPRESSION, value: imp[i], ts });
      if (open[i] > 0) metricsBatch.push({ campaignId: campaign.id, channel, variant, event: MetricEvent.OPEN, value: open[i], ts });
      if (click[i] > 0) metricsBatch.push({ campaignId: campaign.id, channel, variant, event: MetricEvent.CLICK, value: click[i], ts });
      if (conv[i] > 0) {
        // Split conversions into single events with revenue values
        for (let k = 0; k < conv[i]; k++) {
          const revenue = channel === 'email' ? 600 + Math.random() * 900 : 400 + Math.random() * 700;
          metricsBatch.push({ campaignId: campaign.id, channel, variant, event: MetricEvent.CONVERSION, value: Math.round(revenue * 100) / 100, ts });
        }
      }
    }
  }
  if (metricsBatch.length > 0) {
    await prisma.metric.createMany({ data: metricsBatch });
  }

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@moduldom.pl',
      passwordHash: hashPasswordDev('Admin123!'),
      companyId: company.id,
      role: UserRole.ADMIN,
    },
  });

  console.log('Seed completed:', {
    company: company.name,
    products: productsAll.length,
    trends: trendList.length,
    campaign: campaign.id,
    admin: admin.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
