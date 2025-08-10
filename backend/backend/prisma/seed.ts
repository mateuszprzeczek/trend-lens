import { PrismaClient, Prisma, ProductAvailability, TrendSignalSource, UserRole } from '@prisma/client';
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
          'Wzrost zapytań dla frazy „dom modułowy L 70m2”',
          'Sezonowo rosnący popyt na małe metraże',
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
          'Więcej materiałów video o elewacjach z thermo-drewna',
          'Moda na naturalne wykończenia',
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
          'Rosnąca liczba wzmianek o domach bez pozwolenia',
          'Zmiany przepisów budowlanych zwiększają zainteresowanie',
        ],
      },
    }),
  ]);

  // TrendSignals (random-ish per trend)
  const trendList = await prisma.trend.findMany({ where: { clusterId: cluster.id } });
  const now = new Date();
  for (const t of trendList) {
    const signals = [] as Prisma.TrendSignalCreateManyInput[];
    for (let i = 6; i >= 0; i--) {
      const ts = new Date(now);
      ts.setDate(now.getDate() - i);
      const base = Math.random() * 100 + 50;
      signals.push({ trendId: t.id, source: TrendSignalSource.GOOGLE_TRENDS, value: Math.round((base + Math.random() * 20) * 10) / 10, ts });
      signals.push({ trendId: t.id, source: TrendSignalSource.REDDIT, value: Math.round((base / 3 + Math.random() * 10) * 10) / 10, ts });
      signals.push({ trendId: t.id, source: TrendSignalSource.YOUTUBE, value: Math.round((base / 2 + Math.random() * 15) * 10) / 10, ts });
    }
    await prisma.trendSignal.createMany({ data: signals });
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
