import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard, JwtPayload } from '../guards/jwt.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

type AuthRequest = Request & { user: JwtPayload };

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('puestos')
  listPuestos() {
    return this.employeesService.listPuestos();
  }

  @Get()
  list(@Query('filter') filter: string = '', @Req() req: AuthRequest) {
    return this.employeesService.list(filter, req.user.sub, clientIp(req));
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.getById(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateEmployeeDto, @Req() req: AuthRequest) {
    return this.employeesService.create(dto, req.user.sub, clientIp(req));
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
    @Req() req: AuthRequest,
  ) {
    return this.employeesService.update(id, dto, req.user.sub, clientIp(req));
  }

  @Post(':id/log-delete')
  @HttpCode(200)
  logDeleteAttempt(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.employeesService.logDeleteAttempt(id, req.user.sub, clientIp(req));
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.employeesService.remove(id, req.user.sub, clientIp(req));
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
