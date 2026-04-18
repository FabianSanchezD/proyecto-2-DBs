import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginAvailabilityDto } from './dto/login-availability.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-availability')
  @HttpCode(200)
  loginAvailability(@Body() dto: LoginAvailabilityDto, @Req() req: Request) {
    return this.authService.loginAvailability(dto, clientIp(req));
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, clientIp(req));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request) {
    const header = req.header('authorization');
    await this.authService.logout(header, clientIp(req));
  }
}

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim() !== '') {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first.slice(0, 45);
    }
  }
  const raw = req.socket.remoteAddress;
  if (raw && raw.trim() !== '') {
    return raw.slice(0, 45);
  }
  return '0.0.0.0';
}
