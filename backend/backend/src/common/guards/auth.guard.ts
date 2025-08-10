import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { verifyJwtHS256 } from '../auth/jwt.util';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const path = req.path || '';
    const method = req.method || 'GET';

    // Public endpoints
    if (path === '/health') return true;
    if (path === '/auth/login' && method === 'POST') return true;

    const auth = req.headers['authorization'];
    const secret = process.env.JWT_SECRET || 'dev_secret';

    if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
      const token = auth.substring('Bearer '.length).trim();
      const { valid, payload } = verifyJwtHS256(token, secret);
      if (valid && payload) {
        // Attach user to request
        (req as any).user = {
          userId: payload.sub,
          email: payload.email,
          companyId: payload.companyId,
          role: payload.role,
        };
        return true;
      }
    }

    // Dev override via x-company-id
    const companyIdHeader = req.headers['x-company-id'] as string | undefined;
    if (companyIdHeader) {
      (req as any).user = { companyId: companyIdHeader };
      return true;
    }

    throw new UnauthorizedException('Unauthorized: provide Bearer token or x-company-id header');
  }
}
