import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async getMe(companyId?: string) {
    let company = null as any;
    if (companyId) {
      company = await this.prisma.company.findUnique({ where: { id: companyId } });
    }
    if (!company) {
      company = await this.prisma.company.findFirst();
    }
    if (!company) throw new NotFoundException('Company not found');

    return {
      id: company.id,
      name: company.name,
      geoLat: company.geoLat,
      geoLng: company.geoLng,
      radiusKm: company.radiusKm,
      language: company.language,
      brand: {
        primary: company.brandPrimary ?? null,
        secondary: company.brandSecondary ?? null,
        tone: company.brandTone ?? null,
        logoUrl: company.logoUrl ?? null,
      },
    };
  }
}
