import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';

@Injectable()
export class TrendsService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(query: GetRecommendationsDto) {
    const limit = query.limit ?? 5;
    // Try to fetch existing trends; if none, return mock data
    const trends = await this.prisma.trend.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    if (trends.length > 0) {
      return trends.map((t) => ({
        id: t.id,
        name: t.name,
        score: t.score,
        growth7d: t.growth7d,
        forecastPeakInDays: t.forecastPeakInDays ?? null,
        sources: t.sources,
        explanations: t.explanations,
      }));
    }

    // Mock fallback
    return Array.from({ length: limit }).map((_, i) => ({
      id: `tr_${i + 1}`,
      name: `Trend ${i + 1}`,
      score: Math.round(Math.random() * 1000) / 10,
      growth7d: Math.round(Math.random() * 100) / 10,
      forecastPeakInDays: Math.floor(Math.random() * 14) + 1,
      sources: [{ source: 'GOOGLE_TRENDS', weight: 0.6 }, { source: 'REDDIT', weight: 0.4 }],
      explanations: ['Wzrost zainteresowania', 'Sezonowość'],
    }));
  }

  private tokenize(text: string): string[] {
    return (text || '')
      .toLowerCase()
      .split(/[^a-z0-9ąćęłńóśżź]+/)
      .filter((t) => t && t.length > 1);
  }

  private hashEmbedding(text: string, dim = 64): number[] {
    // Simple deterministic hasher-based embedding
    const tokens = this.tokenize(text);
    const vec = new Array(dim).fill(0);
    for (const tok of tokens) {
      let h = 2166136261;
      for (let i = 0; i < tok.length; i++) {
        h ^= tok.charCodeAt(i);
        h = (h * 16777619) >>> 0;
      }
      const idx = h % dim;
      vec[idx] += 1;
    }
    // L2 normalize
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }

  private cosine(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    if (len === 0) return 0;
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < len; i++) {
      const av = a[i] ?? 0;
      const bv = b[i] ?? 0;
      dot += av * bv;
      na += av * av;
      nb += bv * bv;
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
    return dot / denom;
  }

  private buildDocText(p: { title: string; description: string; tags?: string[] }): string {
    return [p.title, p.description, ...(p.tags ?? [])].join(' ');
  }

  private computeTfIdfVectors(docs: string[]): { vocab: Map<string, number>; idf: number[]; tfidf: number[][] } {
    const tokenized = docs.map((d) => this.tokenize(d));
    const vocabMap = new Map<string, number>();
    // Build vocab
    for (const tokens of tokenized) {
      for (const t of tokens) {
        if (!vocabMap.has(t)) {
          vocabMap.set(t, vocabMap.size);
        }
      }
    }
    const V = vocabMap.size;
    const N = tokenized.length;
    const df = new Array(V).fill(0);
    for (const tokens of tokenized) {
      const seen = new Set<number>();
      for (const t of tokens) {
        const idx = vocabMap.get(t)!;
        if (!seen.has(idx)) {
          seen.add(idx);
          df[idx] += 1;
        }
      }
    }
    const idf = df.map((d) => Math.log((N + 1) / (d + 1)) + 1);
    const tfidf: number[][] = [];
    for (const tokens of tokenized) {
      const tf = new Array(V).fill(0);
      for (const t of tokens) {
        const idx = vocabMap.get(t)!;
        tf[idx] += 1;
      }
      const maxTf = tf.reduce((m, v) => (v > m ? v : m), 0) || 1;
      const vec = tf.map((tfv, i) => (tfv / maxTf) * idf[i]);
      // L2 normalize
      const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
      tfidf.push(vec.map((v) => v / norm));
    }
    return { vocab: vocabMap, idf, tfidf };
  }

  private availabilityBoost(avail: string): number {
    switch (avail) {
      case 'IN_STOCK':
        return 1.2;
      case 'LIMITED':
        return 0.8;
      case 'OUT':
        return 0.2;
      default:
        return 1.0;
    }
  }

  async getMatches(trendId: string, companyId?: string) {
    // Resolve companyId stub: pick first company if not provided
    if (!companyId) {
      const firstCompany = await this.prisma.company.findFirst();
      companyId = firstCompany?.id;
    }

    // Fetch trend
    const trend = await this.prisma.trend.findUnique({ where: { id: trendId } });
    if (!trend) throw new NotFoundException('Trend not found');

    const queryText = [trend.name, ...(trend.explanations ?? [])].join(' ');

    // Fetch products for company
    const products = await this.prisma.product.findMany({
      where: companyId ? { companyId } : undefined,
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    if (products.length === 0) {
      return [];
    }

    // Prepare TF-IDF vectors for items lacking embedding
    const texts: string[] = products.map((p) => this.buildDocText({ title: p.title, description: p.description, tags: p.tags as string[] | undefined }));
    // We'll append the trend query to compute a comparable vector in TF-IDF space
    const { vocab, idf, tfidf } = this.computeTfIdfVectors([...texts, queryText]);
    const tfidfTrendVec = tfidf[tfidf.length - 1];
    const tfidfProductVecs = tfidf.slice(0, tfidf.length - 1);

    const results = products.map((p, idx) => {
      let matchScore = 0;
      const reasons: string[] = [];

      // If product has embedding array, compare with trend hash-embedding of matching dim
      const emb = (p.embedding as any) as number[] | undefined;
      if (Array.isArray(emb) && emb.length > 0 && emb.every((v) => typeof v === 'number')) {
        const trendVec = this.hashEmbedding(queryText, emb.length);
        matchScore = this.cosine(trendVec, emb);
        reasons.push('Dopasowanie embedding (cosine)');
      } else {
        // Use TF-IDF vectors
        const prodVec = tfidfProductVecs[idx];
        matchScore = this.cosine(tfidfTrendVec, prodVec);
        // Add top overlapping terms as reason
        const productTokens = this.tokenize(this.buildDocText({ title: p.title, description: p.description, tags: p.tags as string[] | undefined }));
        const trendTokens = new Set(this.tokenize(queryText));
        const overlap = Array.from(new Set(productTokens.filter((t) => trendTokens.has(t)))).slice(0, 5);
        if (overlap.length > 0) {
          reasons.push(`Wspólne słowa kluczowe: ${overlap.join(', ')}`);
        } else {
          reasons.push('Podobieństwo tekstowe (TF-IDF)');
        }
      }

      const margin = typeof p.margin === 'number' ? p.margin : Number(p.margin as unknown);
      const marginFrac = margin > 1 ? margin / 100 : margin;
      const availStr = String(p.availability);
      const availBoost = this.availabilityBoost(availStr);
      const profitScore = trend.score * (marginFrac || 0) * availBoost;

      reasons.push(`Dostępność: ${availStr} (boost ${availBoost})`);
      reasons.push(`Marża: ${Math.round((marginFrac || 0) * 100)}%`);

      return {
        productId: p.id,
        matchScore: Math.round(matchScore * 1000) / 1000,
        profitScore: Math.round(profitScore * 1000) / 1000,
        reasons,
      };
    });

    // Sort by matchScore desc, tie-breaker profitScore
    results.sort((a, b) => (b.matchScore - a.matchScore) || (b.profitScore - a.profitScore));

    return results.slice(0, 5);
  }
}
