import {
  Body,
  Controller,
  Get,
  HttpCode,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard, JwtPayload } from '../guards/jwt.guard';
import { CreateMovementDto } from './dto/create-movement.dto';
import { MovementsService } from './movements.service';

type AuthRequest = Request & { user: JwtPayload };

@Controller('movements')
@UseGuards(JwtAuthGuard)
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get('tipos')
  listTipos() {
    return this.movementsService.listTipos();
  }

  @Get()
  list(@Query('employeeId', ParseIntPipe) employeeId: number) {
    return this.movementsService.list(employeeId);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateMovementDto, @Req() req: AuthRequest) {
    return this.movementsService.create(dto, req.user.sub, clientIp(req));
  }
}

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim() !== '') {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 45);
  }
  const raw = req.socket.remoteAddress;
  if (raw && raw.trim() !== '') return raw.slice(0, 45);
  return '0.0.0.0';
}
