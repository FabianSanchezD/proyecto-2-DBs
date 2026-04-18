import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { LoginAvailabilityDto } from './dto/login-availability.dto';
import { LoginDto } from './dto/login.dto';

type LoginSuccessBody = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  username: string;
};

type JwtPayload = { sub: number; username: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  async loginAvailability(dto: LoginAvailabilityDto, clientIp: string) {
    const trimmedUser = dto.username.trim();
    const code = await this.database.runAuthCheckLoginAvailability(trimmedUser, clientIp);
    if (code === 0) {
      return { allowed: true, resultCode: 0 };
    }
    const message = await this.database.getErrorDescription(code);
    return { allowed: false, resultCode: code, message };
  }

  async login(dto: LoginDto, clientIp: string): Promise<LoginSuccessBody> {
    const trimmedUser = dto.username.trim();
    const sp = await this.database.runAuthLogin(trimmedUser, dto.password, clientIp);

    if (sp.resultCode !== 0) {
      const message = await this.database.getErrorDescription(sp.resultCode);
      throw new HttpException({ resultCode: sp.resultCode, message }, HttpStatus.UNAUTHORIZED);
    }

    if (sp.userId === null || sp.username === null) {
      const message = await this.database.getErrorDescription(50008);
      throw new HttpException({ resultCode: 50008, message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const payload: JwtPayload = { sub: sp.userId, username: sp.username };
    const accessToken = await this.jwt.signAsync(payload);
    const decoded = this.jwt.decode(accessToken) as { exp?: number } | null;
    const nowSec = Math.floor(Date.now() / 1000);
    const expiresIn = decoded?.exp !== undefined ? Math.max(0, decoded.exp - nowSec) : 0;

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      username: sp.username,
    };
  }

  async logout(authorizationHeader: string | undefined, clientIp: string): Promise<void> {
    const token = this.extractBearer(authorizationHeader);
    if (!token) {
      const message = await this.database.getErrorDescription(50008);
      throw new HttpException({ resultCode: 50008, message }, HttpStatus.UNAUTHORIZED);
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      const message = await this.database.getErrorDescription(50008);
      throw new HttpException({ resultCode: 50008, message }, HttpStatus.UNAUTHORIZED);
    }

    const code = await this.database.runAuthLogout(payload.sub, clientIp);
    if (code !== 0) {
      const message = await this.database.getErrorDescription(code);
      if (code === 50001) {
        throw new HttpException({ resultCode: code, message }, HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException({ resultCode: code, message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private extractBearer(header: string | undefined): string | null {
    if (!header) {
      return null;
    }
    const [kind, raw] = header.split(' ');
    if (!kind || !raw || kind.toLowerCase() !== 'bearer') {
      return null;
    }
    return raw.trim() || null;
  }
}
