import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import crypto from 'crypto';
import { signJwtHS256 } from '../../common/auth/jwt.util';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private hashPasswordDev(plain: string): string {
    return crypto.createHash('sha256').update(plain).digest('hex');
  }

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const hash = this.hashPasswordDev(password);
    if (hash !== user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    };
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const accessToken = signJwtHS256(payload, secret, { expiresInSec: 60 * 60 * 12 }); // 12h
    return { accessToken };
  }
}
