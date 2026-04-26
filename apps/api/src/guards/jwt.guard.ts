import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type JwtPayload = { sub: number; username: string };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractBearer(req.header('authorization'));
    if (!token) throw new UnauthorizedException({ resultCode: 50008, message: 'Token requerido.' });
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      (req as Request & { user: JwtPayload }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException({ resultCode: 50008, message: 'Token invalido o expirado.' });
    }
  }

  private extractBearer(header: string | undefined): string | null {
    if (!header) return null;
    const [kind, raw] = header.split(' ');
    if (kind?.toLowerCase() !== 'bearer' || !raw) return null;
    return raw.trim() || null;
  }
}
